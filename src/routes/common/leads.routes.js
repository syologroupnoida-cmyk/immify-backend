import { Router } from 'express';
import { optionalAuthenticateUser } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { createGlobalLeadSchema, leadFormConfigQuerySchema } from '../../validators/lead.validator.js';
import * as leadController from '../../controllers/lead.controller.js';

const router = Router();

router.get('/form-config', validateRequest(leadFormConfigQuerySchema, 'query'), leadController.getFormConfig);

// Public lead form. A valid CLIENT access token links the lead to that user;
// anonymous submissions remain supported.
router.post('/', optionalAuthenticateUser, validateRequest(createGlobalLeadSchema), leadController.createGlobalLead);

export default router;
