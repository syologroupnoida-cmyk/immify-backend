import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as service from '../services/publicVendor/index.js';

export const listPublicVendors = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Public vendors retrieved.',
    data: await service.listPublicVendors(req.query),
  }));

export const getPublicVendor = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Public vendor retrieved.',
    data: await service.getPublicVendor(req.params.vendorId, req.query),
  }));
