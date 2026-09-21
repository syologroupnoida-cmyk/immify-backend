import { Router } from 'express';
import * as controller from '../../controllers/subscription.controller.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { listPublicServiceListingsQuerySchema } from '../../validators/subscription.validator.js';
const router = Router();
router.get('/category/:categoryId', controller.listPublicListingsByCategory);
router.get('/:listingId', controller.getPublicListing);
router.get('/', validateRequest(listPublicServiceListingsQuerySchema, 'query'), controller.listPublicListings);
export default router;
