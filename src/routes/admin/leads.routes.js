import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { activateLeadSchema, listAdminLeadsQuerySchema, rejectLeadSchema } from '../../validators/lead.validator.js';
import * as leadController from '../../controllers/lead.controller.js';

const router = Router();

router.get('/', validateRequest(listAdminLeadsQuerySchema, 'query'), leadController.listAdminLeads);
router.get('/:leadId', leadController.getAdminLead);
router.patch('/:leadId/verify', leadController.verifyLead);
router.patch('/:leadId/activate', validateRequest(activateLeadSchema), leadController.activateLead);
router.patch('/:leadId/reject', validateRequest(rejectLeadSchema), leadController.rejectLead);

export default router;
