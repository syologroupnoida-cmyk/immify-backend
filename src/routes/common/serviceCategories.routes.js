import { Router } from 'express';
import { listPublicCategories } from '../../controllers/serviceCategory.controller.js';

const router = Router();

// GET /api/v1/service-categories
// Public catalog for signup/KYC forms; no authentication required.
router.get('/', listPublicCategories);

export default router;
