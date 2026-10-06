import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { adjustVendorCreditsSchema } from '../../validators/vendorManagement.validator.js';
import * as leadController from '../../controllers/lead.controller.js';

// Vendor credit administration (SUPER_ADMIN only).
// Role gate already applied at routes/super-admin/index.js. Mounted under /vendors.

const router = Router();

// POST /api/v1/super-admin/vendors/:userId/credits/adjust
router.post(
  '/:userId/credits/adjust',
  validateRequest(adjustVendorCreditsSchema),
  leadController.adjustVendorCredits,
);

export default router;
