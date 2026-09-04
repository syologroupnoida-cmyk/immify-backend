import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { listAdminJobApplicationsSchema, updateJobApplicationStatusSchema } from '../../validators/jobApplication.validator.js';
import * as controller from '../../controllers/jobApplication.controller.js';

const router = Router();
router.get('/', validateRequest(listAdminJobApplicationsSchema, 'query'), controller.listAdminApplications);
router.get('/:applicationId', controller.getAdminApplication);
router.patch('/:applicationId/status', validateRequest(updateJobApplicationStatusSchema), controller.updateAdminStatus);
export default router;
