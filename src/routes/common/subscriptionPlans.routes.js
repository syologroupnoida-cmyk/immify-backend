import { Router } from 'express';
import * as controller from '../../controllers/subscription.controller.js';
const router = Router();
router.get('/', controller.listPublicPlans);
router.get('/:planId', controller.getPublicPlan);
export default router;
