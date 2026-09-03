import * as uploadService from '../services/upload/index.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest(
      'File is required. Send multipart/form-data with a "file" field.',
    );
  }

  const result = await uploadService.uploadImage({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    originalname: req.file.originalname,
    purpose: req.body.purpose,
    // Anonymous callers cannot choose an overwrite slot. This prevents one
    // public user from replacing another public user's file by reusing a name.
    name: req.user ? req.body.name : undefined,
    userId: req.user?.id ?? 'anonymous',
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'File uploaded successfully.',
    data: result,
  });
});
