import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as leadService from '../services/lead/index.js';

export const getFormConfig = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Lead form configuration retrieved.', data: await leadService.getFormConfig(req.query) }));

export const createGlobalLead = asyncHandler(async (req, res) => {
  const lead = await leadService.createGlobalLead({
    clientUserId: req.user?.role === 'CLIENT' ? req.user.id : null,
    payload: req.body,
  });
  return sendSuccess(res, { statusCode: 201, message: 'Lead submitted for verification.', data: lead });
});

export const listAdminLeads = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Leads retrieved.', data: await leadService.listAdminLeads(req.query) }));

export const getAdminLead = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Lead retrieved.', data: await leadService.getAdminLead(req.params.leadId) }));

export const verifyLead = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Lead verified.', data: await leadService.verifyLead({ leadId: req.params.leadId, adminId: req.user.id }) }));

export const activateLead = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Lead activated.', data: await leadService.activateLead({ leadId: req.params.leadId, adminId: req.user.id, ...req.body }) }));

export const rejectLead = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Lead rejected.', data: await leadService.rejectLead({ leadId: req.params.leadId, adminId: req.user.id, reason: req.body.reason }) }));

export const listMarketplaceLeads = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Matching leads retrieved.', data: await leadService.listMarketplaceLeads({ vendorUserId: req.user.id, query: req.query }) }));

export const getMarketplaceLead = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Lead retrieved.', data: await leadService.getMarketplaceLead({ leadId: req.params.leadId, vendorUserId: req.user.id }) }));

export const purchaseLead = asyncHandler(async (req, res) =>
  sendSuccess(res, { statusCode: 201, message: 'Lead unlocked.', data: await leadService.purchaseLead({ leadId: req.params.leadId, vendorUserId: req.user.id }) }));

export const listPurchasedLeads = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Purchased leads retrieved.', data: await leadService.listPurchasedLeads({ vendorUserId: req.user.id, query: req.query }) }));

export const getPurchasedLead = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Purchased lead retrieved.', data: await leadService.getPurchasedLead({ leadId: req.params.leadId, vendorUserId: req.user.id }) }));

export const getWallet = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Credit wallet retrieved.', data: await leadService.getWallet(req.user.id) }));

export const adjustVendorCredits = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Vendor credits adjusted.',
    data: await leadService.adjustVendorCredits({
      vendorUserId: req.params.userId,
      adminId: req.user.id,
      ...req.body,
    }),
  }));

export const getOfferings = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Vendor offerings retrieved.', data: await leadService.getOfferings(req.user.id) }));

export const replaceOfferings = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Vendor offerings updated.', data: await leadService.replaceOfferings({ vendorUserId: req.user.id, payload: req.body }) }));
