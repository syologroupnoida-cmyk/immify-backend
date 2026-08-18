import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { updateOfferingsSchema } from '../../validators/lead.validator.js';
import * as leadController from '../../controllers/lead.controller.js';

const router = Router();

router.get('/', leadController.getOfferings);
router.put('/', validateRequest(updateOfferingsSchema), leadController.replaceOfferings);

export default router;
