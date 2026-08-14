import { Router } from 'express';

import commonRoutes from './common/index.js';
import superAdminRoutes from './super-admin/index.js';
import adminRoutes from './admin/index.js';
import vendorRoutes from './vendor/index.js';

const router = Router();

// Public + shared endpoints (health, auth — used by every role)
router.use('/', commonRoutes);

// Panel-scoped routers (role guards applied inside each)
router.use('/super-admin', superAdminRoutes);
router.use('/admin', adminRoutes);
router.use('/vendor', vendorRoutes);

export default router;
