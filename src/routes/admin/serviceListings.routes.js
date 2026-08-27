import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { listServiceListingsForReviewSchema, rejectServiceListingSchema } from '../../validators/subscription.validator.js';
import * as controller from '../../controllers/subscription.controller.js';

const router = Router();

router.get('/', validateRequest(listServiceListingsForReviewSchema, 'query'), controller.listListingsForReview);
router.post('/:listingId/approve', controller.approveListing);
router.post('/:listingId/reject', validateRequest(rejectServiceListingSchema), controller.rejectListing);

export default router;
