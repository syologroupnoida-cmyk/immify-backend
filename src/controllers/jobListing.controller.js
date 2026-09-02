import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as service from '../services/jobListing/index.js';

const ok = (res, message, data, statusCode = 200) => sendSuccess(res, { statusCode, message, data });

export const createVendorJob = asyncHandler(async (req, res) => ok(res, 'Job listing created as a draft.', await service.createVendorJob({ vendorUserId: req.user.id, payload: req.body }), 201));
export const listVendorJobs = asyncHandler(async (req, res) => ok(res, 'Job listings retrieved.', await service.listVendorJobs(req.user.id, req.query)));
export const getVendorJob = asyncHandler(async (req, res) => ok(res, 'Job listing retrieved.', await service.getVendorJob(req.user.id, req.params.jobId)));
export const updateVendorJob = asyncHandler(async (req, res) => ok(res, 'Job listing updated.', await service.updateVendorJob({ vendorUserId: req.user.id, id: req.params.jobId, payload: req.body })));
export const deleteVendorJob = asyncHandler(async (req, res) => ok(res, 'Job listing deleted.', await service.deleteVendorJob(req.user.id, req.params.jobId)));
export const submitVendorJob = asyncHandler(async (req, res) => ok(res, 'Job listing submitted for admin review.', await service.submitVendorJob(req.user.id, req.params.jobId)));

export const createAdminJob = asyncHandler(async (req, res) => ok(res, 'Job listing created.', await service.createAdminJob({ adminId: req.user.id, payload: req.body }), 201));
export const listAdminJobs = asyncHandler(async (req, res) => ok(res, 'Job listings retrieved.', await service.listAdminJobs(req.query)));
export const getAdminJob = asyncHandler(async (req, res) => ok(res, 'Job listing retrieved.', await service.getAdminJob(req.params.jobId)));
export const updateAdminJob = asyncHandler(async (req, res) => ok(res, 'Job listing updated.', await service.updateAdminJob(req.params.jobId, req.body)));
export const deleteAdminJob = asyncHandler(async (req, res) => ok(res, 'Job listing deleted.', await service.deleteAdminJob(req.params.jobId)));
export const approveJob = asyncHandler(async (req, res) => ok(res, 'Job listing approved and published.', await service.approveJob({ adminId: req.user.id, id: req.params.jobId })));
export const rejectJob = asyncHandler(async (req, res) => ok(res, 'Job listing rejected.', await service.rejectJob({ adminId: req.user.id, id: req.params.jobId, reason: req.body.reason })));

export const listPublicJobs = asyncHandler(async (req, res) => ok(res, 'Published job listings retrieved.', await service.listPublicJobs(req.query)));
export const getPublicJob = asyncHandler(async (req, res) => ok(res, 'Published job listing retrieved.', await service.getPublicJob(req.params.jobId)));
