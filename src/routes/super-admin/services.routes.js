import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import * as categoryController from '../../controllers/serviceCategory.controller.js';
import { updateServiceSchema } from '../../validators/serviceCategory.validator.js';

// Direct edit/remove for a single child service — SUPER_ADMIN only.
// Role gate already applied at routes/super-admin/index.js. Mounted under /services.

const router = Router();

// PATCH /api/v1/super-admin/services/:serviceId
router.patch(
  '/:serviceId',
  validateRequest(updateServiceSchema),
  categoryController.updateService,
);

// DELETE /api/v1/super-admin/services/:serviceId
router.delete('/:serviceId', categoryController.deleteService);

export default router;
