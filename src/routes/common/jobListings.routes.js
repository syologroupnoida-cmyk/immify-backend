import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { listPublicJobsSchema } from '../../validators/jobListing.validator.js';
import * as controller from '../../controllers/jobListing.controller.js';

const router = Router();
router.get('/', validateRequest(listPublicJobsSchema, 'query'), controller.listPublicJobs);
router.get('/:jobId', controller.getPublicJob);
export default router;
