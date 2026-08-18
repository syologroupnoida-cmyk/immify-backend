import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import * as vendorMgmtController from '../../controllers/vendorManagement.controller.js';
import {
  activateVendorSchema,
  adjustVendorCreditsSchema,
  deactivateVendorSchema,
} from '../../validators/vendorManagement.validator.js';
import * as leadController from '../../controllers/lead.controller.js';

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

router.post(
  '/:userId/credits/adjust',
  validateRequest(adjustVendorCreditsSchema),
  leadController.adjustVendorCredits,
);

export default router;
