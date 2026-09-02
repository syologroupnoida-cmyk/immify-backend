import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { createJobListingSchema, listVendorJobsSchema, updateJobListingSchema } from '../../validators/jobListing.validator.js';
import * as controller from '../../controllers/jobListing.controller.js';

const router = Router();
router.post('/', validateRequest(createJobListingSchema), controller.createVendorJob);
router.get('/', validateRequest(listVendorJobsSchema, 'query'), controller.listVendorJobs);
router.get('/:jobId', controller.getVendorJob);
router.patch('/:jobId', validateRequest(updateJobListingSchema), controller.updateVendorJob);
router.delete('/:jobId', controller.deleteVendorJob);
router.post('/:jobId/submit', controller.submitVendorJob);
export default router;
