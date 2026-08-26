import prisma from '../config/db.js';

const catalogSelect = {
  category: { select: { id: true, name: true, slug: true } },
  service: { select: { id: true, name: true } },
};

const safeMarketplaceSelect = {
  id: true,
  type: true,
  status: true,
  creditCost: true,
  maxUnlocks: true,
  unlockCount: true,
  country: true,
  state: true,
  city: true,
  message: true,
  activatedAt: true,
  expiresAt: true,
  createdAt: true,
  ...catalogSelect,
};

const fullLeadSelect = {
  ...safeMarketplaceSelect,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  whatsappNumber: true,
  gender: true,
  dateOfBirth: true,
  maritalStatus: true,
  nationality: true,
  servicesRequired: true,
  destinationCountries: true,
  highestQualification: true,
  passingYear: true,
  university: true,
  percentageOrCgpa: true,
  currentCompany: true,
  currentDesignation: true,
  industry: true,
  yearsOfExperience: true,
  currentSalary: true,
  relevantExperience: true,
  languageTestTaken: true,
  overallScore: true,
  listeningScore: true,
  readingScore: true,
  writingScore: true,
  speakingScore: true,
  passportAvailable: true,
  passportExpiry: true,
  familyMaritalStatus: true,
  spouseQualification: true,
  children: true,
  dependents: true,
  investmentBudget: true,
  applicationTimeline: true,
  resumeUrl: true,
  passportDocumentUrl: true,
  ieltsDocumentUrl: true,
  educationalCertificateUrls: true,
  experienceLetterUrls: true,
  bankStatementUrl: true,
  additionalInformation: true,
  consentToCalls: true,
  termsAccepted: true,
  reviewedAt: true,
  reviewedByAdminId: true,
  rejectedAt: true,
  rejectionReason: true,
  directVendorUserId: true,
  clientUserId: true,
};

export const findActiveService = (serviceId, categoryId) =>
  prisma.service.findFirst({
    where: { id: serviceId, categoryId, isActive: true, category: { isActive: true } },
    select: { id: true, name: true, categoryId: true, category: { select: { id: true, name: true, slug: true } } },
  });

export const createGlobalLead = (data) =>
  prisma.lead.create({ data: { ...data, type: 'GLOBAL', status: 'PENDING' }, select: fullLeadSelect });

export const listAdminLeads = async ({ status, type, categoryId, serviceId, take, skip }) => {
  const where = { ...(status && { status }), ...(type && { type }), ...(categoryId && { categoryId }), ...(serviceId && { serviceId }) };
  const [items, total] = await Promise.all([
    prisma.lead.findMany({ where, select: fullLeadSelect, orderBy: { createdAt: 'desc' }, take, skip }),
    prisma.lead.count({ where }),
  ]);
  return { items, total };
};

export const findAdminLead = (id) => prisma.lead.findUnique({ where: { id }, select: fullLeadSelect });

export const transitionLead = ({ id, fromStatus, data }) =>
  prisma.lead.updateMany({ where: { id, status: fromStatus }, data });

export const findMatchedMarketplaceLead = (leadId, vendorUserId) =>
  prisma.lead.findFirst({
    where: {
      id: leadId,
      type: 'GLOBAL',
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      category: { vendorOfferings: { some: { vendorUserId, isActive: true } } },
    },
    select: safeMarketplaceSelect,
  });

export const listMatchedMarketplaceLeads = async ({ vendorUserId, categoryId, serviceId, take, skip }) => {
  const where = {
    type: 'GLOBAL',
    status: 'ACTIVE',
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    ...(categoryId && { categoryId }),
    ...(serviceId && { serviceId }),
    category: { vendorOfferings: { some: { vendorUserId, isActive: true } } },
  };
  const [items, total] = await Promise.all([
    prisma.lead.findMany({ where, select: safeMarketplaceSelect, orderBy: { activatedAt: 'desc' }, take, skip }),
    prisma.lead.count({ where }),
  ]);
  return { items, total };
};

export const purchaseLead = async ({ leadId, vendorUserId }) => {
  const unavailable = new Error('LEAD_UNAVAILABLE');
  const insufficientCredits = new Error('INSUFFICIENT_CREDITS');

  try {
    return await prisma.$transaction(async (tx) => {
    const existing = await tx.leadPurchase.findUnique({
      where: { leadId_vendorUserId: { leadId, vendorUserId } },
      select: { id: true },
    });
    if (existing) return { alreadyPurchased: true, purchaseId: existing.id };

    const lead = await tx.lead.findFirst({
      where: {
        id: leadId,
        type: 'GLOBAL',
        status: 'ACTIVE',
        creditCost: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        category: { vendorOfferings: { some: { vendorUserId, isActive: true } } },
      },
      select: { id: true, creditCost: true, maxUnlocks: true, unlockCount: true },
    });
    if (!lead || !lead.maxUnlocks || lead.unlockCount >= lead.maxUnlocks) throw unavailable;

    const isFinalUnlock = lead.unlockCount + 1 >= lead.maxUnlocks;
    const claimed = await tx.lead.updateMany({
      where: { id: lead.id, status: 'ACTIVE', unlockCount: lead.unlockCount },
      data: {
        unlockCount: { increment: 1 },
        ...(isFinalUnlock && { status: 'EXPIRED', expiresAt: new Date() }),
      },
    });
    if (claimed.count !== 1) throw unavailable;

    const debit = await tx.vendorProfile.updateMany({
      where: {
        userId: vendorUserId,
        kycStatus: 'APPROVED',
        creditBalance: { gte: lead.creditCost },
        user: { isActive: true },
      },
      data: { creditBalance: { decrement: lead.creditCost } },
    });
    if (debit.count !== 1) throw insufficientCredits;

    const purchase = await tx.leadPurchase.create({
      data: { leadId, vendorUserId, creditsSpent: lead.creditCost },
    });
    const wallet = await tx.vendorProfile.findUnique({ where: { userId: vendorUserId }, select: { creditBalance: true } });
    await tx.vendorCreditTransaction.create({
      data: {
        vendorUserId,
        leadPurchaseId: purchase.id,
        type: 'LEAD_UNLOCK',
        amount: -lead.creditCost,
        balanceAfter: wallet.creditBalance,
        description: `Unlocked global lead ${leadId}`,
      },
    });
    return {
      purchaseId: purchase.id,
      creditsSpent: lead.creditCost,
      balance: wallet.creditBalance,
      unlockCount: lead.unlockCount + 1,
      maxUnlocks: lead.maxUnlocks,
      leadExpired: isFinalUnlock,
    };
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error === unavailable) return { unavailable: true };
    if (error === insufficientCredits) return { insufficientCredits: true };
    throw error;
  }
};

export const findPurchasedLead = (leadId, vendorUserId) =>
  prisma.lead.findFirst({
    where: { id: leadId, purchases: { some: { vendorUserId, status: 'COMPLETED' } } },
    select: fullLeadSelect,
  });

export const listPurchasedLeads = async ({ vendorUserId, take, skip }) => {
  const where = { vendorUserId, status: 'COMPLETED' };
  const [rows, total] = await Promise.all([
    prisma.leadPurchase.findMany({ where, orderBy: { purchasedAt: 'desc' }, take, skip, select: { id: true, creditsSpent: true, purchasedAt: true, lead: { select: fullLeadSelect } } }),
    prisma.leadPurchase.count({ where }),
  ]);
  return { items: rows, total };
};

export const getVendorWallet = (vendorUserId) =>
  prisma.vendorProfile.findUnique({
    where: { userId: vendorUserId },
    select: { creditBalance: true, creditTransactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
  });

export const adjustVendorCredits = ({ vendorUserId, adminId, amount, reason }) =>
  prisma.$transaction(async (tx) => {
    const updated = await tx.vendorProfile.updateMany({
      where: {
        userId: vendorUserId,
        ...(amount < 0 && { creditBalance: { gte: Math.abs(amount) } }),
      },
      data: { creditBalance: { increment: amount } },
    });
    if (updated.count !== 1) return { notFoundOrInsufficient: true };
    const wallet = await tx.vendorProfile.findUnique({ where: { userId: vendorUserId }, select: { creditBalance: true } });
    const transaction = await tx.vendorCreditTransaction.create({
      data: {
        vendorUserId,
        type: 'ADMIN_ADJUSTMENT',
        amount,
        balanceAfter: wallet.creditBalance,
        description: reason,
        metadata: { adminId },
      },
    });
    return { balance: wallet.creditBalance, transaction };
  }, { isolationLevel: 'Serializable' });

export const replaceVendorOfferings = ({ vendorUserId, categoryIds }) =>
  prisma.$transaction(async (tx) => {
    const validCategories = await tx.serviceCategory.findMany({ where: { id: { in: categoryIds }, isActive: true }, select: { id: true } });
    if (validCategories.length !== new Set(categoryIds).size) {
      return { invalidSelection: true };
    }
    await tx.vendorCategoryOffering.deleteMany({ where: { vendorUserId } });
    if (categoryIds.length) await tx.vendorCategoryOffering.createMany({ data: [...new Set(categoryIds)].map((categoryId) => ({ vendorUserId, categoryId })) });
    return { categoryIds: [...new Set(categoryIds)] };
  });

export const getVendorOfferings = (vendorUserId) => prisma.vendorProfile.findUnique({
  where: { userId: vendorUserId },
  select: {
    categoryOfferings: { where: { isActive: true }, include: { category: true } },
  },
});
