import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as service from '../services/jobApplication/index.js';

const ok = (res, message, data, statusCode = 200) => sendSuccess(res, { statusCode, message, data });

export const submitApplication = asyncHandler(async (req, res) => ok(res, 'Application submitted successfully.', await service.submitApplication({
  jobListingId: req.params.jobId, payload: req.body,
}), 201));
export const listAdminApplications = asyncHandler(async (req, res) => ok(res, 'Job applications retrieved.', await service.listAdminApplications(req.query)));
export const getAdminApplication = asyncHandler(async (req, res) => ok(res, 'Job application retrieved.', await service.getAdminApplication(req.params.applicationId)));
export const updateAdminStatus = asyncHandler(async (req, res) => ok(res, 'Application status updated.', await service.updateAdminStatus(req.params.applicationId, req.body)));
export const listVendorApplications = asyncHandler(async (req, res) => ok(res, 'Assigned job applications retrieved.', await service.listVendorApplications(req.user.id, req.query)));
export const getVendorApplication = asyncHandler(async (req, res) => ok(res, 'Job application retrieved.', await service.getVendorApplication(req.user.id, req.params.applicationId)));
export const updateVendorStatus = asyncHandler(async (req, res) => ok(res, 'Application status updated.', await service.updateVendorStatus(req.user.id, req.params.applicationId, req.body)));
