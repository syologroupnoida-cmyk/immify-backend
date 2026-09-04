import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../../middlewares/auth.middleware.js';
import adminRoutes from './admin.routes.js';
import vendorsRoutes from './vendors.routes.js';
import leadsRoutes from './leads.routes.js';
import serviceListingsRoutes from './serviceListings.routes.js';
import jobListingsRoutes from './jobListings.routes.js';
import jobApplicationsRoutes from './jobApplications.routes.js';

const router = Router();

// SUPER_ADMIN can do everything ADMIN can — both roles allowed here.
router.use(authenticateUser, authorizeRoles(['SUPER_ADMIN', 'ADMIN']));

router.use('/', adminRoutes);
router.use('/vendors', vendorsRoutes);
router.use('/leads', leadsRoutes);
router.use('/service-listings', serviceListingsRoutes);
router.use('/job-listings', jobListingsRoutes);
router.use('/job-applications', jobApplicationsRoutes);

export default router;
