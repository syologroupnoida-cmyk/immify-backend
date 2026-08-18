import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../../middlewares/auth.middleware.js';
import superAdminRoutes from './superAdmin.routes.js';
import vendorsRoutes from './vendors.routes.js';
import serviceCategoriesRoutes from './serviceCategories.routes.js';
import servicesRoutes from './services.routes.js';
import subscriptionPlansRoutes from './subscriptionPlans.routes.js';

const router = Router();

// Every route in this folder requires SUPER_ADMIN role.
router.use(authenticateUser, authorizeRoles(['SUPER_ADMIN']));

router.use('/', superAdminRoutes);
router.use('/vendors', vendorsRoutes);
router.use('/service-categories', serviceCategoriesRoutes);
router.use('/services', servicesRoutes);
router.use('/subscription-plans', subscriptionPlansRoutes);

export default router;
