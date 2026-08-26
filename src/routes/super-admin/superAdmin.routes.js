import { Router } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { createAdminSchema } from '../../validators/auth.validator.js';
import * as superAdminController from '../../controllers/superAdmin.controller.js';
import * as subscriptionController from '../../controllers/subscription.controller.js';
import {
  confirmSubscriptionPaymentSchema,
  listAdminSubscriptionsQuerySchema,
  rejectSubscriptionPaymentSchema,
} from '../../validators/subscription.validator.js';

const router = Router();

router.get('/ping', (req, res) =>
  sendSuccess(res, {
    message: 'Super Admin panel reachable.',
    data: { user: req.user },
  }),
);

router.post(
  '/admins',
  validateRequest(createAdminSchema),
  superAdminController.createAdmin,
);

router.get(
  '/subscriptions',
  validateRequest(listAdminSubscriptionsQuerySchema, 'query'),
  subscriptionController.listAdminSubscriptions,
);

router.get('/subscriptions/:subscriptionId', subscriptionController.getAdminSubscription);

router.post(
  '/subscriptions/:subscriptionId/reject-payment',
  validateRequest(rejectSubscriptionPaymentSchema),
  subscriptionController.rejectPayment,
);

router.post(
  '/subscriptions/:subscriptionId/confirm-payment',
  validateRequest(confirmSubscriptionPaymentSchema),
  subscriptionController.confirmPayment,
);

export default router;
