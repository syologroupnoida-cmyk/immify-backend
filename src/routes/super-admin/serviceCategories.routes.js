import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import * as categoryController from '../../controllers/serviceCategory.controller.js';
import {
  createServiceCategorySchema,
  updateServiceCategorySchema,
  childServiceSchema,
} from '../../validators/serviceCategory.validator.js';

// Service category catalog — SUPER_ADMIN only.
// Role gate already applied at routes/super-admin/index.js. Mounted under /service-categories.

const router = Router();

// POST /api/v1/super-admin/service-categories
// Single payload — category fields + optional nested `services` array.
router.post('/', validateRequest(createServiceCategorySchema), categoryController.createCategory);

// GET /api/v1/super-admin/service-categories
router.get('/', categoryController.listCategories);

// GET /api/v1/super-admin/service-categories/:id
router.get('/:id', categoryController.getCategory);

// PATCH /api/v1/super-admin/service-categories/:id
// Category fields plus optional services: entries with id update; without id create.
router.patch(
  '/:id',
  validateRequest(updateServiceCategorySchema),
  categoryController.updateCategory,
);

// DELETE /api/v1/super-admin/service-categories/:id (cascades to its services)
router.delete('/:id', categoryController.deleteCategory);

// POST /api/v1/super-admin/service-categories/:id/services — add one child service
router.post(
  '/:id/services',
  validateRequest(childServiceSchema),
  categoryController.addService,
);

export default router;
