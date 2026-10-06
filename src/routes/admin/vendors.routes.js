import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import * as vendorMgmtController from '../../controllers/vendorManagement.controller.js';
import {
  activateVendorSchema,
  deactivateVendorSchema,
  listVendorsQuerySchema,
} from '../../validators/vendorManagement.validator.js';

// Vendor management endpoints (ADMIN + SUPER_ADMIN).
// Role gate already applied at routes/admin/index.js. Mounted under /vendors.

const router = Router();

// GET /api/v1/admin/vendors
router.get(
  '/',
  validateRequest(listVendorsQuerySchema, 'query'),
  vendorMgmtController.listVendors,
);

// GET /api/v1/admin/vendors/:userId
router.get('/:userId', vendorMgmtController.getVendorDetail);
router.post(
  '/:userId/activate',
  validateRequest(activateVendorSchema),
  vendorMgmtController.activateVendor,
);
router.post(
  '/:userId/deactivate',
  validateRequest(deactivateVendorSchema),
  vendorMgmtController.deactivateVendor,
);

export default router;
