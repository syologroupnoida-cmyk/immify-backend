import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { listVendorJobApplicationsSchema, updateJobApplicationStatusSchema } from '../../validators/jobApplication.validator.js';
import * as controller from '../../controllers/jobApplication.controller.js';

const router = Router();
router.get('/', validateRequest(listVendorJobApplicationsSchema, 'query'), controller.listVendorApplications);
router.get('/:applicationId', controller.getVendorApplication);
router.patch('/:applicationId/status', validateRequest(updateJobApplicationStatusSchema), controller.updateVendorStatus);
export default router;
