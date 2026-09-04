import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as service from '../services/immigrationProgram/index.js';

export const listPrograms = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Immigration programs retrieved.',
  data: await service.listPrograms(req.query),
}));

export const getFilterOptions = asyncHandler(async (_req, res) => sendSuccess(res, {
  message: 'Immigration program filter options retrieved.',
  data: await service.getFilterOptions(),
}));

export const getProgram = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Immigration program retrieved.',
  data: await service.getProgram(req.params.programId),
}));
