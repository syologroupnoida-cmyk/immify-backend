import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { listVendorLeadsQuerySchema } from '../../validators/lead.validator.js';
import * as leadController from '../../controllers/lead.controller.js';

const router = Router();

router.get('/marketplace', validateRequest(listVendorLeadsQuerySchema, 'query'), leadController.listMarketplaceLeads);
router.get('/marketplace/:leadId', leadController.getMarketplaceLead);
router.get('/purchased', validateRequest(listVendorLeadsQuerySchema, 'query'), leadController.listPurchasedLeads);
router.get('/purchased/:leadId', leadController.getPurchasedLead);
router.post('/:leadId/purchase', leadController.purchaseLead);

export default router;
