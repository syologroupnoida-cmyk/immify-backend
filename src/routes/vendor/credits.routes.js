import { Router } from 'express';
import * as leadController from '../../controllers/lead.controller.js';

const router = Router();
router.get('/', leadController.getWallet);

export default router;
