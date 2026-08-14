import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import * as vendorMgmtController from '../../controllers/vendorManagement.controller.js';
import {
  activateVendorSchema,
  deactivateVendorSchema,
} from '../../validators/vendorManagement.validator.js';

// Vendor management — WRITE endpoints (SUPER_ADMIN only).
// Role gate already applied at routes/super-admin/index.js. Mounted under /vendors.

const router = Router();

// POST /api/v1/super-admin/vendors/:userId/activate
router.post(
  '/:userId/activate',
  validateRequest(activateVendorSchema),
  vendorMgmtController.activateVendor,
);

// POST /api/v1/super-admin/vendors/:userId/deactivate
router.post(
  '/:userId/deactivate',
  validateRequest(deactivateVendorSchema),
  vendorMgmtController.deactivateVendor,
);

export default router;
