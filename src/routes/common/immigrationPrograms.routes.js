import { Router } from 'express';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { listImmigrationProgramsSchema } from '../../validators/immigrationProgram.validator.js';
import * as controller from '../../controllers/immigrationProgram.controller.js';

const router = Router();
router.get('/', validateRequest(listImmigrationProgramsSchema, 'query'), controller.listPrograms);
router.get('/filter-options', controller.getFilterOptions);
router.get('/:programId', controller.getProgram);
export default router;
