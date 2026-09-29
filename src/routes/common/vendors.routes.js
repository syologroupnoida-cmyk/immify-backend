import { Router } from 'express';
import * as controller from '../../controllers/publicVendor.controller.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import {
  listPublicVendorsQuerySchema,
  publicVendorDetailQuerySchema,
} from '../../validators/publicVendor.validator.js';

const router = Router();

router.get('/', validateRequest(listPublicVendorsQuerySchema, 'query'), controller.listPublicVendors);
router.get('/:vendorId', validateRequest(publicVendorDetailQuerySchema, 'query'), controller.getPublicVendor);

export default router;
