import { Router } from 'express';
import { listPublicCategories, listPublicServicesByCategory } from '../../controllers/serviceCategory.controller.js';

const router = Router();

// GET /api/v1/service-categories
// Public catalog for signup/KYC forms; no authentication required.
router.get('/', listPublicCategories);
router.get('/:categoryId', listPublicServicesByCategory);

export default router;
