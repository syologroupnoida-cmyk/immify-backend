import { Router } from 'express';
import { optionalAuthenticateUser } from '../../middlewares/auth.middleware.js';
import { createRateLimit } from '../../middlewares/rateLimit.middleware.js';
import { uploadSingleFile } from '../../middlewares/upload.middleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { uploadImageSchema } from '../../validators/upload.validator.js';
import * as uploadController from '../../controllers/upload.controller.js';

const router = Router();

const publicUploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many file uploads. Please try again later.',
  code: 'UPLOAD_RATE_LIMITED',
});

const uploadHandlers = [
  optionalAuthenticateUser,
  publicUploadRateLimit,
  uploadSingleFile,
  validateRequest(uploadImageSchema),
  uploadController.uploadImage,
];

// Generic public route for images and PDFs. /image remains a compatible alias.
router.post('/file', ...uploadHandlers);
router.post('/image', ...uploadHandlers);

export default router;
