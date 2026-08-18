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
    planNameSnapshot: plan.name, priceInPaiseSnapshot: plan.priceInPaise, currencySnapshot: plan.currency,
    maxPublicServicesSnapshot: plan.maxPublicServices, maxJobPostsSnapshot: plan.maxJobPosts,
    jobPortalAccessSnapshot: plan.jobPortalAccess, directLeadCreditPriceSnapshot: plan.directLeadCreditPrice,
    durationDaysSnapshot: plan.durationDays,
    categories: { create: plan.categories.map(({ categoryId }) => ({ categoryId })) },
    payments: { create: { amountInPaise: plan.priceInPaise, currency: plan.currency } },
  },
  include: { plan: true, categories: { include: { category: true } }, payments: true },
});

export const listVendorSubscriptions = (vendorUserId) => prisma.vendorSubscription.findMany({
  where: { vendorUserId }, include: { plan: true, categories: { include: { category: true } }, payments: true }, orderBy: { createdAt: 'desc' },
});

export const findSubscription = (id) => prisma.vendorSubscription.findUnique({
  where: { id }, include: { plan: true, categories: { include: { category: true } }, payments: true },
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
  const activated = await tx.vendorSubscription.update({
    where: { id: subscriptionId }, data: { status: 'ACTIVE', startsAt: now, expiresAt },
    include: { plan: true, categories: { include: { category: true } }, payments: true },
  });
  return { subscription: activated };
}, { isolationLevel: 'Serializable' });

export const getActiveSubscription = (vendorUserId) => prisma.vendorSubscription.findFirst({
  where: { vendorUserId, status: 'ACTIVE', startsAt: { lte: new Date() }, expiresAt: { gt: new Date() } },
  include: { categories: true, plan: true }, orderBy: { expiresAt: 'desc' },
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
