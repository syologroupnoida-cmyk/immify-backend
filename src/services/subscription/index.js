import { ApiError } from '../../utils/ApiError.js';
import * as repo from '../../repositories/subscription.repository.js';

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const unique = (values) => [...new Set(values)];

const effectiveStatusFor = (subscription) => {
  if (!subscription) return null;
  if (subscription.status === 'ACTIVE' && new Date(subscription.expiresAt) < new Date()) {
    return 'EXPIRED';
  }
  return subscription.status;
};

const assertCategories = async (categoryIds) => {
  const ids = unique(categoryIds);
  const valid = await repo.findActiveCategoryIds(ids);
  if (valid.length !== ids.length) throw ApiError.badRequest('Every plan category must exist and be active.');
  return ids;
};

export const createPlan = async ({ adminId, payload }) => {
  const categoryIds = await assertCategories(payload.categoryIds);
  const { isActive, ...data } = payload;
  return repo.createPlan({ ...data, status: isActive ? 'ACTIVE' : 'DRAFT', categoryIds, slug: slugify(payload.name), createdByAdminId: adminId, ...(isActive && { activatedAt: new Date() }) });
};
export const listAdminPlans = () => repo.listPlans();
export const listPublicPlans = () => repo.listPlans({ status: 'ACTIVE' });

export const listVendorPlans = async (vendorUserId) => {
  const [items, currentSub] = await Promise.all([
    repo.listPlans({ status: 'ACTIVE' }),
    repo.getActiveSubscription(vendorUserId),
  ]);
  const currentPlanId = currentSub?.planId ?? null;
  const enriched = items.map((plan) => {
    const isCurrentPlan = plan.id === currentPlanId;
    const action = isCurrentPlan ? 'CURRENT_PLAN' : currentSub ? 'UPGRADE_NOW' : 'BUY';

    return {
      ...plan,
      isCurrentPlan,
      canPurchase: !isCurrentPlan,
      action,
      buttonLabel: isCurrentPlan ? 'Current Plan' : currentSub ? 'Upgrade Now' : 'Buy Now',
    };
  });

  return {
    items: enriched,
    total: enriched.length,
    currentSubscription: currentSub
      ? {
          id: currentSub.id,
          planId: currentSub.planId,
          status: effectiveStatusFor(currentSub),
          startsAt: currentSub.startsAt,
          expiresAt: currentSub.expiresAt,
          plan: currentSub.plan,
        }
      : null,
  };
};
export const getPublicPlan = async (id) => {
  const plan = await repo.findPlan(id);
  if (!plan || plan.status !== 'ACTIVE') throw ApiError.notFound('Active subscription plan not found.');
  return plan;
};
export const getAdminPlan = async (id) => {
  const plan = await repo.findPlan(id);
  if (!plan) throw ApiError.notFound('Subscription plan not found.');
  return plan;
};
export const updatePlan = async ({ id, adminId, payload }) => {
  const plan = await getAdminPlan(id);
  const { categoryIds: rawIds, name, isActive, ...fields } = payload;
  const hasCommercialChanges = Boolean(rawIds || name || Object.keys(fields).length);
  if (hasCommercialChanges && !['DRAFT', 'INACTIVE'].includes(plan.status)) throw ApiError.conflict('Deactivate an active plan before changing its commercial terms.');
  if (isActive && plan.status === 'ARCHIVED') throw ApiError.conflict('An archived plan cannot be activated.');
  const categoryIds = rawIds ? await assertCategories(rawIds) : undefined;
  const salePrice = fields.salePriceInPaise ?? plan.salePriceInPaise;
  const offerPrice = Object.hasOwn(fields, 'offerPriceInPaise') ? fields.offerPriceInPaise : plan.offerPriceInPaise;
  if (offerPrice != null && offerPrice > salePrice) throw ApiError.badRequest('Offer price cannot exceed sale price.');
  const statusData = isActive === undefined ? {} : isActive
    ? { status: 'ACTIVE', activatedAt: new Date(), archivedAt: null }
    : { status: plan.status === 'DRAFT' ? 'DRAFT' : 'INACTIVE' };
  return repo.updatePlan({ id, categoryIds, data: { ...fields, ...statusData, ...(name && { name, slug: slugify(name) }), updatedByAdminId: adminId } });
};
export const activatePlan = async (id) => {
  const plan = await getAdminPlan(id);
  if (plan.status === 'ARCHIVED') throw ApiError.conflict('An archived plan cannot be activated.');
  if (!plan.categories.length) throw ApiError.badRequest('A plan needs at least one category before activation.');
  return repo.setPlanStatus(id, 'ACTIVE', { activatedAt: new Date(), archivedAt: null });
};
export const deactivatePlan = (id) => repo.setPlanStatus(id, 'INACTIVE');
export const archivePlan = (id) => repo.setPlanStatus(id, 'ARCHIVED', { archivedAt: new Date() });

export const checkout = async ({ vendorUserId, payload }) => {
  const eligibility = await repo.findVendorEligibility(vendorUserId);
  if (!eligibility?.user.isActive || eligibility.kycStatus !== 'APPROVED') {
    throw ApiError.forbidden('An active, KYC-approved vendor account is required to purchase a subscription.');
  }
  const plan = await getPublicPlan(payload.planId);
  const currentSubscription = await repo.getActiveSubscription(vendorUserId);
  if (currentSubscription?.planId === plan.id) {
    throw ApiError.conflict('This is already your current active subscription plan.', {
      code: 'PLAN_ALREADY_ACTIVE',
      subscriptionId: currentSubscription.id,
    });
  }
  const pendingSubscription = await repo.checkout({ vendorUserId, plan, autoRenew: payload.autoRenew });

  // Temporary purchase flow until the payment gateway is integrated. Checkout
  // immediately marks the generated payment as paid and activates the plan.
  const result = await repo.confirmPayment({
    subscriptionId: pendingSubscription.id,
    providerPaymentId: `CHECKOUT-${pendingSubscription.id}`,
    provider: 'CHECKOUT_BYPASS',
  });
  if (result.invalid) throw ApiError.conflict('The subscription checkout could not be activated.');

  return {
    subscription: result.subscription,
    paymentRequired: false,
    paymentProvider: 'CHECKOUT_BYPASS',
    message: 'Subscription purchased and activated successfully.',
  };
};
export const listMySubscriptions = (vendorUserId) => repo.listVendorSubscriptions(vendorUserId);
export const getMySubscription = async ({ vendorUserId, id }) => {
  const sub = await repo.findSubscription(id);
  if (!sub || sub.vendorUserId !== vendorUserId) throw ApiError.notFound('Subscription not found.');
  return sub;
};
export const getMyEntitlements = async (vendorUserId) => {
  const subscription = await repo.getSubscriptionEntitlements(vendorUserId);
  if (!subscription) return { hasActiveSubscription: false, subscription: null, usage: null, categories: [] };
  const [publishedPackages, submittedJobPosts] = await Promise.all([
    repo.countPublishedListings(vendorUserId),
    repo.countSubscriptionJobPosts(subscription.id),
  ]);
  const limit = subscription.maxPackagesSnapshot;
  const jobLimit = subscription.maxJobPostsSnapshot;
  return {
    hasActiveSubscription: true,
    subscription: {
      id: subscription.id,
      planId: subscription.planId,
      planName: subscription.planNameSnapshot,
      startsAt: subscription.startsAt,
      expiresAt: subscription.expiresAt,
      includedCredits: subscription.includedCreditsSnapshot,
      directLeadPriceCredits: subscription.directLeadPriceCreditsSnapshot,
      jobPortalAccess: subscription.jobPortalAccessSnapshot,
      maxJobPosts: jobLimit,
      rules: subscription.plan.rules,
    },
    usage: {
      publishedPackages,
      maxPackages: limit,
      remainingPackages: limit === null ? null : Math.max(0, limit - publishedPackages),
      submittedJobPosts,
      remainingJobPosts: !subscription.jobPortalAccessSnapshot
        ? 0
        : jobLimit === null ? null : Math.max(0, jobLimit - submittedJobPosts),
    },
    categories: subscription.categories.map(({ category }) => category),
  };
};
export const listAdminSubscriptions = (query) => repo.listAdminSubscriptions(query);
export const getAdminSubscription = async (id) => {
  const subscription = await repo.findAdminSubscription(id);
  if (!subscription) throw ApiError.notFound('Subscription purchase not found.');
  return subscription;
};
export const confirmPayment = async ({ subscriptionId, payload }) => {
  const result = await repo.confirmPayment({ subscriptionId, ...payload });
  if (result.invalid) throw ApiError.conflict('Only a pending subscription with a payment can be activated.');
  return result.subscription;
};
export const rejectPayment = async ({ subscriptionId, reason }) => {
  const result = await repo.rejectPayment({ subscriptionId, reason });
  if (result.invalid) throw ApiError.conflict('Only a pending subscription payment can be rejected.');
  return result.subscription;
};

const requireEntitlement = async ({ vendorUserId, categoryId, requireSlot = false }) => {
  const subscription = await repo.getActiveSubscription(vendorUserId);
  if (!subscription) throw ApiError.forbidden('An active subscription is required.', { code: 'SUBSCRIPTION_REQUIRED' });
  if (!subscription.categories.some((item) => item.categoryId === categoryId)) {
    throw ApiError.forbidden('This category is not included in your subscription.', { code: 'CATEGORY_NOT_INCLUDED' });
  }
  if (requireSlot && subscription.maxPackagesSnapshot !== null) {
    const used = await repo.countPublishedListings(vendorUserId);
    if (used >= subscription.maxPackagesSnapshot) {
      throw ApiError.forbidden('Your public service listing limit has been reached.', { code: 'SERVICE_LIMIT_REACHED', limit: subscription.maxPackagesSnapshot });
    }
  }
  return subscription;
};

export const createListing = async ({ vendorUserId, payload, draft = true }) => {
  await requireEntitlement({ vendorUserId, categoryId: payload.categoryId });
  if (payload.serviceId && !(await repo.findCatalogService(payload.serviceId, payload.categoryId))) {
    throw ApiError.badRequest('The selected service does not belong to the selected active category.');
  }
  return repo.createListing({
    ...payload,
    vendorUserId,
    reviewStatus: draft ? 'DRAFT' : 'PENDING_REVIEW',
    ...(!draft && { submittedAt: new Date() }),
  });
};
export const listMyListings = (vendorUserId) => repo.listVendorListings(vendorUserId);
export const updateListing = async ({ vendorUserId, id, payload }) => {
  const listing = await repo.findVendorListing(id, vendorUserId);
  if (!listing) throw ApiError.notFound('Service listing not found.');
  if (!['DRAFT', 'REJECTED'].includes(listing.reviewStatus)) {
    throw ApiError.conflict('Only draft or rejected service listings can be edited.');
  }
  if (payload.serviceId && !(await repo.findCatalogService(payload.serviceId, listing.categoryId))) {
    throw ApiError.badRequest('The selected service does not belong to the listing category.');
  }
  return repo.updateListing(id, { ...payload, reviewStatus: 'DRAFT', rejectionReason: null, reviewedAt: null, reviewedByAdminId: null });
};
export const submitListingForReview = async ({ vendorUserId, id }) => {
  const listing = await repo.findVendorListing(id, vendorUserId);
  if (!listing) throw ApiError.notFound('Service listing not found.');
  if (!['DRAFT', 'REJECTED'].includes(listing.reviewStatus)) {
    throw ApiError.conflict('Only draft or rejected service listings can be submitted.');
  }
  await requireEntitlement({ vendorUserId, categoryId: listing.categoryId });
  return repo.updateListing(id, {
    reviewStatus: 'PENDING_REVIEW', submittedAt: new Date(), rejectionReason: null,
    reviewedAt: null, reviewedByAdminId: null, isPublished: false, isVisible: false,
  });
};

export const listListingsForReview = (query) => repo.listListingsForReview(query);
export const approveListing = async ({ adminId, id }) => {
  const listing = await repo.findListingById(id);
  if (!listing) throw ApiError.notFound('Service listing not found.');
  if (listing.reviewStatus !== 'PENDING_REVIEW') throw ApiError.conflict('Only pending service listings can be approved.');
  await requireEntitlement({ vendorUserId: listing.vendorUserId, categoryId: listing.categoryId, requireSlot: true });
  return repo.updateListing(id, {
    reviewStatus: 'APPROVED', reviewedAt: new Date(), reviewedByAdminId: adminId,
    rejectionReason: null, isPublished: true, isVisible: true,
  });
};
export const rejectListing = async ({ adminId, id, reason }) => {
  const listing = await repo.findListingById(id);
  if (!listing) throw ApiError.notFound('Service listing not found.');
  if (listing.reviewStatus !== 'PENDING_REVIEW') throw ApiError.conflict('Only pending service listings can be rejected.');
  return repo.updateListing(id, {
    reviewStatus: 'REJECTED', reviewedAt: new Date(), reviewedByAdminId: adminId,
    rejectionReason: reason, isPublished: false, isVisible: false,
  });
};
export const listPublicListings = async () => {
  const listings = await repo.listPublicListings();
  return listings
    .filter((listing) => listing.vendor.subscriptions.some((sub) => sub.categories.some((item) => item.categoryId === listing.categoryId)))
    .map(({ vendor, ...listing }) => ({ ...listing, vendor: vendor.user }));
};

export const listPublicListingsByCategory = async (categoryId) => {
  const result = await repo.listPublicListingsByCategory(categoryId);
  if (!result.category) throw ApiError.notFound('Active service category not found.');
  return {
    category: result.category,
    services: result.listings.map(({ vendor, ...listing }) => ({ ...listing, vendor: vendor.user })),
  };
};
