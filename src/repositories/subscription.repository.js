import prisma from '../config/db.js';

const planInclude = { categories: { include: { category: true } } };

export const findActiveCategoryIds = async (ids) => (await prisma.serviceCategory.findMany({
  where: { id: { in: ids }, isActive: true }, select: { id: true },
})).map((row) => row.id);
export const findVendorEligibility = (userId) => prisma.vendorProfile.findUnique({ where: { userId }, select: { kycStatus: true, user: { select: { isActive: true } } } });

export const createPlan = (data) => prisma.subscriptionPlan.create({
  data: { ...data, categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) }, categoryIds: undefined },
  include: planInclude,
});
export const listPlans = (where = {}) => prisma.subscriptionPlan.findMany({ where, include: planInclude, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] });
export const findPlan = (id) => prisma.subscriptionPlan.findUnique({ where: { id }, include: planInclude });
export const updatePlan = ({ id, data, categoryIds }) => prisma.$transaction(async (tx) => {
  if (categoryIds) {
    await tx.subscriptionPlanCategory.deleteMany({ where: { planId: id } });
    await tx.subscriptionPlanCategory.createMany({ data: categoryIds.map((categoryId) => ({ planId: id, categoryId })) });
  }
  return tx.subscriptionPlan.update({ where: { id }, data, include: planInclude });
});
export const setPlanStatus = (id, status, data = {}) => prisma.subscriptionPlan.update({ where: { id }, data: { status, ...data }, include: planInclude });

export const checkout = ({ vendorUserId, plan, autoRenew }) => prisma.vendorSubscription.create({
  data: {
    vendorUserId, planId: plan.id, autoRenew,
    planNameSnapshot: plan.name, salePriceInPaiseSnapshot: plan.salePriceInPaise,
    offerPriceInPaiseSnapshot: plan.offerPriceInPaise, currencySnapshot: plan.currency,
    includedCreditsSnapshot: plan.includedCredits, maxPackagesSnapshot: plan.maxPackages, maxJobPostsSnapshot: plan.maxJobPosts,
    jobPortalAccessSnapshot: plan.jobPortalAccess, directLeadPriceCreditsSnapshot: plan.directLeadPriceCredits,
    durationDaysSnapshot: plan.durationDays,
    categories: { create: plan.categories.map(({ categoryId }) => ({ categoryId })) },
    payments: { create: { amountInPaise: plan.offerPriceInPaise ?? plan.salePriceInPaise, currency: plan.currency } },
  },
  include: { plan: true, categories: { include: { category: true } }, payments: true },
});

export const listVendorSubscriptions = (vendorUserId) => prisma.vendorSubscription.findMany({
  where: { vendorUserId }, include: { plan: true, categories: { include: { category: true } }, payments: true }, orderBy: { createdAt: 'desc' },
});

export const findSubscription = (id) => prisma.vendorSubscription.findUnique({
  where: { id }, include: { plan: true, categories: { include: { category: true } }, payments: true },
});

export const listAdminSubscriptions = ({ status, vendorUserId, planId, take, skip }) => prisma.vendorSubscription.findMany({
  where: { ...(status && { status }), ...(vendorUserId && { vendorUserId }), ...(planId && { planId }) },
  include: {
    plan: true,
    vendor: { select: { userId: true, user: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
    categories: { include: { category: true } },
    payments: true,
  },
  orderBy: { createdAt: 'desc' },
  take,
  skip,
});

export const findAdminSubscription = (id) => prisma.vendorSubscription.findUnique({
  where: { id },
  include: {
    plan: true,
    vendor: { select: { userId: true, creditBalance: true, user: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
    categories: { include: { category: { include: { services: { where: { isActive: true } } } } } },
    payments: true,
    creditTransaction: true,
  },
});

export const confirmPayment = ({ subscriptionId, providerPaymentId, provider }) => prisma.$transaction(async (tx) => {
  const subscription = await tx.vendorSubscription.findUnique({ where: { id: subscriptionId }, include: { payments: true } });
  if (!subscription || subscription.status !== 'PENDING_PAYMENT') return { invalid: true };
  const now = new Date();
  const expiresAt = new Date(now.getTime() + subscription.durationDaysSnapshot * 86400000);
  await tx.vendorSubscription.updateMany({
    where: { vendorUserId: subscription.vendorUserId, status: 'ACTIVE', id: { not: subscriptionId } },
    data: { status: 'CANCELLED', cancelledAt: now, cancellationReason: 'Replaced by a new subscription.' },
  });
  await tx.subscriptionPayment.update({
    where: { id: subscription.payments[0].id },
    data: { status: 'PAID', provider, providerPaymentId, paidAt: now },
  });
  if (subscription.includedCreditsSnapshot > 0) {
    await tx.vendorProfile.update({
      where: { userId: subscription.vendorUserId },
      data: { creditBalance: { increment: subscription.includedCreditsSnapshot } },
    });
    const wallet = await tx.vendorProfile.findUnique({ where: { userId: subscription.vendorUserId }, select: { creditBalance: true } });
    await tx.vendorCreditTransaction.create({
      data: {
        vendorUserId: subscription.vendorUserId,
        subscriptionId,
        type: 'SUBSCRIPTION_CREDIT',
        amount: subscription.includedCreditsSnapshot,
        balanceAfter: wallet.creditBalance,
        description: `Credits included with ${subscription.planNameSnapshot}`,
      },
    });
  }
  const activated = await tx.vendorSubscription.update({
    where: { id: subscriptionId }, data: { status: 'ACTIVE', startsAt: now, expiresAt },
    include: { plan: true, categories: { include: { category: true } }, payments: true },
  });
  return { subscription: activated };
}, { isolationLevel: 'Serializable' });

export const rejectPayment = ({ subscriptionId, reason }) => prisma.$transaction(async (tx) => {
  const subscription = await tx.vendorSubscription.findUnique({ where: { id: subscriptionId }, include: { payments: true } });
  if (!subscription || subscription.status !== 'PENDING_PAYMENT' || !subscription.payments[0]) return { invalid: true };
  const now = new Date();
  await tx.subscriptionPayment.update({
    where: { id: subscription.payments[0].id },
    data: { status: 'FAILED', failedAt: now, providerResponse: { manualRejectionReason: reason } },
  });
  const failed = await tx.vendorSubscription.update({
    where: { id: subscriptionId },
    data: { status: 'PAYMENT_FAILED', cancellationReason: reason },
    include: { plan: true, categories: { include: { category: true } }, payments: true },
  });
  return { subscription: failed };
}, { isolationLevel: 'Serializable' });

export const getActiveSubscription = (vendorUserId) => prisma.vendorSubscription.findFirst({
  where: { vendorUserId, status: 'ACTIVE', startsAt: { lte: new Date() }, expiresAt: { gt: new Date() } },
  include: { categories: true, plan: true }, orderBy: { expiresAt: 'desc' },
});

export const getSubscriptionEntitlements = (vendorUserId) => prisma.vendorSubscription.findFirst({
  where: { vendorUserId, status: 'ACTIVE', startsAt: { lte: new Date() }, expiresAt: { gt: new Date() } },
  include: {
    plan: true,
    categories: { include: { category: { include: { services: { where: { isActive: true }, orderBy: { name: 'asc' } } } } } },
  },
  orderBy: { expiresAt: 'desc' },
});

export const findCatalogService = (serviceId, categoryId) => prisma.service.findFirst({ where: { id: serviceId, categoryId, isActive: true }, select: { id: true } });
export const countPublishedListings = (vendorUserId) => prisma.vendorServiceListing.count({ where: { vendorUserId, isPublished: true } });
export const createListing = (data) => prisma.vendorServiceListing.create({ data, include: { category: true, service: true } });
export const listVendorListings = (vendorUserId) => prisma.vendorServiceListing.findMany({ where: { vendorUserId }, include: { category: true, service: true }, orderBy: { createdAt: 'desc' } });
export const findVendorListing = (id, vendorUserId) => prisma.vendorServiceListing.findFirst({ where: { id, vendorUserId }, include: { category: true, service: true } });
export const updateListing = (id, data) => prisma.vendorServiceListing.update({ where: { id }, data, include: { category: true, service: true } });
export const listPublicListings = () => prisma.vendorServiceListing.findMany({
  where: { isPublished: true, isVisible: true, vendor: { user: { isActive: true }, subscriptions: { some: { status: 'ACTIVE', startsAt: { lte: new Date() }, expiresAt: { gt: new Date() } } } } },
  include: { category: true, service: true, vendor: { select: {
    user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    subscriptions: { where: { status: 'ACTIVE', startsAt: { lte: new Date() }, expiresAt: { gt: new Date() } }, select: { categories: { select: { categoryId: true } } } },
  } } },
  orderBy: { createdAt: 'desc' },
});
