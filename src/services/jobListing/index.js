import { ApiError } from '../../utils/ApiError.js';
import * as repo from '../../repositories/jobListing.repository.js';

const editableStatuses = ['DRAFT', 'REJECTED'];

const requireJobEntitlement = async (vendorUserId) => {
  const subscription = await repo.getActiveJobSubscription(vendorUserId);
  if (!subscription) {
    throw ApiError.forbidden('An active subscription with job portal access is required.', { code: 'JOB_PORTAL_SUBSCRIPTION_REQUIRED' });
  }
  return subscription;
};

const requireAvailableSlot = async (subscription, excludeId) => {
  if (subscription.maxJobPostsSnapshot === null) return;
  const used = await repo.countSubmittedJobsForSubscription(subscription.id, excludeId);
  if (used >= subscription.maxJobPostsSnapshot) {
    throw ApiError.forbidden('Your subscription job posting limit has been reached.', {
      code: 'JOB_POST_LIMIT_REACHED', limit: subscription.maxJobPostsSnapshot, used,
    });
  }
};

export const createVendorJob = async ({ vendorUserId, payload }) => {
  const subscription = await requireJobEntitlement(vendorUserId);
  return repo.create({ ...payload, vendorUserId, subscriptionId: subscription.id });
};

export const listVendorJobs = (vendorUserId, query) => repo.listVendorJobs(vendorUserId, query);
export const getVendorJob = async (vendorUserId, id) => {
  const job = await repo.findVendorJob(id, vendorUserId);
  if (!job) throw ApiError.notFound('Job listing not found.');
  return job;
};
export const updateVendorJob = async ({ vendorUserId, id, payload }) => {
  await requireJobEntitlement(vendorUserId);
  const job = await getVendorJob(vendorUserId, id);
  if (!editableStatuses.includes(job.reviewStatus)) throw ApiError.conflict('Only draft or rejected job listings can be edited.');
  return repo.update(id, { ...payload, reviewStatus: 'DRAFT', rejectionReason: null, reviewedAt: null, reviewedByAdminId: null });
};
export const deleteVendorJob = async (vendorUserId, id) => {
  const job = await getVendorJob(vendorUserId, id);
  if (!editableStatuses.includes(job.reviewStatus)) throw ApiError.conflict('Only draft or rejected job listings can be deleted.');
  await repo.remove(id);
  return { id };
};
export const submitVendorJob = async (vendorUserId, id) => {
  const job = await getVendorJob(vendorUserId, id);
  if (!editableStatuses.includes(job.reviewStatus)) throw ApiError.conflict('Only draft or rejected job listings can be submitted.');
  const subscription = await requireJobEntitlement(vendorUserId);
  await requireAvailableSlot(subscription, id);
  return repo.update(id, {
    subscriptionId: subscription.id, reviewStatus: 'PENDING_REVIEW', submittedAt: new Date(),
    rejectionReason: null, reviewedAt: null, reviewedByAdminId: null,
    isPublished: false, isVisible: false, publishedAt: null,
  });
};

export const createAdminJob = ({ adminId, payload }) => {
  const { reviewStatus = 'DRAFT', ...data } = payload;
  const approved = reviewStatus === 'APPROVED';
  return repo.create({
    ...data, reviewStatus, ...(reviewStatus !== 'DRAFT' && { submittedAt: new Date() }),
    ...(approved && { reviewedAt: new Date(), reviewedByAdminId: adminId, isPublished: true, isVisible: true, publishedAt: new Date() }),
  });
};
export const listAdminJobs = (query) => repo.listForAdmin(query);
export const getAdminJob = async (id) => {
  const job = await repo.findById(id);
  if (!job) throw ApiError.notFound('Job listing not found.');
  return job;
};
export const updateAdminJob = async (id, payload) => {
  await getAdminJob(id);
  return repo.update(id, payload);
};
export const deleteAdminJob = async (id) => {
  await getAdminJob(id);
  await repo.remove(id);
  return { id };
};
export const approveJob = async ({ adminId, id }) => {
  const job = await getAdminJob(id);
  if (job.reviewStatus !== 'PENDING_REVIEW') throw ApiError.conflict('Only pending job listings can be approved.');
  if (job.vendorUserId) {
    const subscription = await requireJobEntitlement(job.vendorUserId);
    await requireAvailableSlot(subscription, id);
  }
  const now = new Date();
  return repo.update(id, { reviewStatus: 'APPROVED', reviewedAt: now, reviewedByAdminId: adminId, rejectionReason: null, isPublished: true, isVisible: true, publishedAt: now });
};
export const rejectJob = async ({ adminId, id, reason }) => {
  const job = await getAdminJob(id);
  if (job.reviewStatus !== 'PENDING_REVIEW') throw ApiError.conflict('Only pending job listings can be rejected.');
  return repo.update(id, { reviewStatus: 'REJECTED', reviewedAt: new Date(), reviewedByAdminId: adminId, rejectionReason: reason, isPublished: false, isVisible: false, publishedAt: null });
};

export const listPublicJobs = (query) => repo.listPublic(query);
export const getPublicJob = async (id) => {
  const job = await repo.findPublicById(id);
  if (!job) throw ApiError.notFound('Published job listing not found.');
  return job;
};
