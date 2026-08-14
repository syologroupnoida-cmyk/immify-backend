import * as categoryService from '../services/serviceCategory/index.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// -----------------------------------------------------------------------------
//   Category — SUPER_ADMIN only (role gate at routes/super-admin/index.js)
// -----------------------------------------------------------------------------

export const createCategory = asyncHandler(async (req, res) => {
  const data = await categoryService.createCategory(req.body);
  return sendSuccess(res, { statusCode: 201, message: 'Service category created.', data });
});

export const listCategories = asyncHandler(async (req, res) => {
  const data = await categoryService.listCategories();
  return sendSuccess(res, { statusCode: 200, message: 'Service categories retrieved.', data });
});

export const getCategory = asyncHandler(async (req, res) => {
  const data = await categoryService.getCategory(req.params.id);
  return sendSuccess(res, { statusCode: 200, message: 'Service category retrieved.', data });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = await categoryService.updateCategory(req.params.id, req.body);
  return sendSuccess(res, { statusCode: 200, message: 'Service category updated.', data });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  return sendSuccess(res, { statusCode: 200, message: 'Service category deleted.', data: null });
});

// -----------------------------------------------------------------------------
//   Child services
// -----------------------------------------------------------------------------

export const addService = asyncHandler(async (req, res) => {
  const data = await categoryService.addService(req.params.id, req.body);
  return sendSuccess(res, { statusCode: 201, message: 'Service added.', data });
});

export const updateService = asyncHandler(async (req, res) => {
  const data = await categoryService.updateService(req.params.serviceId, req.body);
  return sendSuccess(res, { statusCode: 200, message: 'Service updated.', data });
});

export const deleteService = asyncHandler(async (req, res) => {
  await categoryService.deleteService(req.params.serviceId);
  return sendSuccess(res, { statusCode: 200, message: 'Service deleted.', data: null });
});
