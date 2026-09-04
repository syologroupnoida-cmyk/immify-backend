import { ApiError } from '../../utils/ApiError.js';
import * as applicationRepo from '../../repositories/jobApplication.repository.js';
import * as jobRepo from '../../repositories/jobListing.repository.js';

export const submitApplication = async ({ jobListingId, payload }) => {
  const job = await jobRepo.findPublicById(jobListingId);
  if (!job) throw ApiError.notFound('Published job listing not found.');
  if (job.applicationDeadline && job.applicationDeadline < new Date()) {
    throw ApiError.conflict('The application deadline for this job has passed.');
  }

  const duplicate = await applicationRepo.findDuplicate(jobListingId, payload.email);
  if (duplicate) throw ApiError.conflict('An application with this email has already been submitted for this job.');

  try {
    return await applicationRepo.create({
      ...payload,
      consent: undefined,
      jobListingId,
      assignedVendorUserId: job.vendorUserId ?? null,
    });
  } catch (error) {
    if (error?.code === 'P2002') throw ApiError.conflict('An application with this email has already been submitted for this job.');
    throw error;
  }
};

export const listAdminApplications = (query) => applicationRepo.listForAdmin(query);
export const getAdminApplication = async (id) => {
  const item = await applicationRepo.findForAdmin(id);
  if (!item) throw ApiError.notFound('Job application not found.');
  return item;
};
export const listVendorApplications = (vendorUserId, query) => applicationRepo.listForVendor(vendorUserId, query);
export const getVendorApplication = async (vendorUserId, id) => {
  const item = await applicationRepo.findForVendor(id, vendorUserId);
  if (!item) throw ApiError.notFound('Job application not found.');
  return item;
};
export const updateAdminStatus = async (id, payload) => {
  await getAdminApplication(id);
  return applicationRepo.updateStatus(id, payload.status, payload.note);
};
export const updateVendorStatus = async (vendorUserId, id, payload) => {
  await getVendorApplication(vendorUserId, id);
  return applicationRepo.updateStatus(id, payload.status, payload.note);
};
