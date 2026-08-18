import { ApiError } from '../../utils/ApiError.js';
import * as repo from '../../repositories/subscription.repository.js';

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const unique = (values) => [...new Set(values)];

const assertCategories = async (categoryIds) => {
  const ids = unique(categoryIds);
  const valid = await repo.findActiveCategoryIds(ids);
  if (valid.length !== ids.length) throw ApiError.badRequest('Every plan category must exist and be active.');
  return ids;
};

export const createPlan = async ({ adminId, payload }) => {
  const categoryIds = await assertCategories(payload.categoryIds);
  return repo.createPlan({ ...payload, categoryIds, slug: slugify(payload.name), createdByAdminId: adminId });
};
export const listAdminPlans = () => repo.listPlans();
export const listPublicPlans = () => repo.listPlans({ status: 'ACTIVE' });
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
  if (!['DRAFT', 'INACTIVE'].includes(plan.status)) throw ApiError.conflict('Deactivate an active plan before changing its commercial terms.');
  const { categoryIds: rawIds, name, ...fields } = payload;
  const categoryIds = rawIds ? await assertCategories(rawIds) : undefined;
  return repo.updatePlan({ id, categoryIds, data: { ...fields, ...(name && { name, slug: slugify(name) }), updatedByAdminId: adminId } });
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
  const subscription = await repo.checkout({ vendorUserId, plan, autoRenew: payload.autoRenew });
  return { subscription, paymentRequired: true, paymentProvider: 'MANUAL', message: 'Awaiting verified payment confirmation.' };
};
export const listMySubscriptions = (vendorUserId) => repo.listVendorSubscriptions(vendorUserId);
export const getMySubscription = async ({ vendorUserId, id }) => {
  const sub = await repo.findSubscription(id);
  if (!sub || sub.vendorUserId !== vendorUserId) throw ApiError.notFound('Subscription not found.');
  return sub;
};
export const confirmPayment = async ({ subscriptionId, payload }) => {
  const result = await repo.confirmPayment({ subscriptionId, ...payload });
  if (result.invalid) throw ApiError.conflict('Only a pending subscription with a payment can be activated.');
  return result.subscription;
};

const requireEntitlement = async ({ vendorUserId, categoryId, requireSlot = false }) => {
  const subscription = await repo.getActiveSubscription(vendorUserId);
  if (!subscription) throw ApiError.forbidden('An active subscription is required.', { code: 'SUBSCRIPTION_REQUIRED' });
  if (!subscription.categories.some((item) => item.categoryId === categoryId)) {
    throw ApiError.forbidden('This category is not included in your subscription.', { code: 'CATEGORY_NOT_INCLUDED' });
  }
  if (requireSlot && subscription.maxPublicServicesSnapshot !== null) {
    const used = await repo.countPublishedListings(vendorUserId);
    if (used >= subscription.maxPublicServicesSnapshot) {
      throw ApiError.forbidden('Your public service listing limit has been reached.', { code: 'SERVICE_LIMIT_REACHED', limit: subscription.maxPublicServicesSnapshot });
    }
  }
  return subscription;
};

export const createListing = async ({ vendorUserId, payload }) => {
  await requireEntitlement({ vendorUserId, categoryId: payload.categoryId, requireSlot: payload.publish });
  if (payload.serviceId && !(await repo.findCatalogService(payload.serviceId, payload.categoryId))) {
    throw ApiError.badRequest('The selected service does not belong to the selected active category.');
  }
  const { publish, ...data } = payload;
  return repo.createListing({ ...data, vendorUserId, isPublished: publish, isVisible: publish });
};
export const listMyListings = (vendorUserId) => repo.listVendorListings(vendorUserId);
export const updateListing = async ({ vendorUserId, id, payload }) => {
  const listing = await repo.findVendorListing(id, vendorUserId);
  if (!listing) throw ApiError.notFound('Service listing not found.');
  return repo.updateListing(id, payload);
};
export const setListingPublication = async ({ vendorUserId, id, published }) => {
  const listing = await repo.findVendorListing(id, vendorUserId);
  if (!listing) throw ApiError.notFound('Service listing not found.');
  if (published && !listing.isPublished) await requireEntitlement({ vendorUserId, categoryId: listing.categoryId, requireSlot: true });
  return repo.updateListing(id, { isPublished: published, isVisible: published });
};
export const listPublicListings = async () => {
  const listings = await repo.listPublicListings();
  return listings
    .filter((listing) => listing.vendor.subscriptions.some((sub) => sub.categories.some((item) => item.categoryId === listing.categoryId)))
    .map(({ vendor, ...listing }) => ({ ...listing, vendor: vendor.user }));
};
