import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { listPublicJobsSchema } from '../../validators/jobListing.validator.js';
import * as controller from '../../controllers/jobListing.controller.js';
import * as applicationController from '../../controllers/jobApplication.controller.js';
import { createJobApplicationSchema } from '../../validators/jobApplication.validator.js';
import { createRateLimit } from '../../middlewares/rateLimit.middleware.js';

const router = Router();
const applicationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many job applications. Please try again later.',
  code: 'JOB_APPLICATION_RATE_LIMITED',
});
router.get('/', validateRequest(listPublicJobsSchema, 'query'), controller.listPublicJobs);
router.post('/:jobId/applications', applicationRateLimit, validateRequest(createJobApplicationSchema), applicationController.submitApplication);
router.get('/:jobId', controller.getPublicJob);
export default router;
