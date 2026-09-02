import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { createAdminJobListingSchema, listAdminJobsSchema, rejectJobListingSchema, updateJobListingSchema } from '../../validators/jobListing.validator.js';
import * as controller from '../../controllers/jobListing.controller.js';

const router = Router();
router.post('/', validateRequest(createAdminJobListingSchema), controller.createAdminJob);
router.get('/', validateRequest(listAdminJobsSchema, 'query'), controller.listAdminJobs);
router.get('/:jobId', controller.getAdminJob);
router.patch('/:jobId', validateRequest(updateJobListingSchema), controller.updateAdminJob);
router.delete('/:jobId', controller.deleteAdminJob);
router.post('/:jobId/approve', controller.approveJob);
router.post('/:jobId/reject', validateRequest(rejectJobListingSchema), controller.rejectJob);
export default router;
