import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { createSubscriptionPlanSchema, updateSubscriptionPlanSchema } from '../../validators/subscription.validator.js';
import * as controller from '../../controllers/subscription.controller.js';

const router = Router();
router.post('/', validateRequest(createSubscriptionPlanSchema), controller.createPlan);
router.get('/', controller.listAdminPlans);
router.get('/:planId', controller.getAdminPlan);
router.patch('/:planId', validateRequest(updateSubscriptionPlanSchema), controller.updatePlan);
router.post('/:planId/activate', controller.activatePlan);
router.post('/:planId/deactivate', controller.deactivatePlan);
router.post('/:planId/archive', controller.archivePlan);
export default router;
