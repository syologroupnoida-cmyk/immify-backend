import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../../middlewares/auth.middleware.js';
import vendorRoutes from './vendor.routes.js';
import leadsRoutes from './leads.routes.js';
import offeringsRoutes from './offerings.routes.js';
import creditsRoutes from './credits.routes.js';
import subscriptionsRoutes from './subscriptions.routes.js';
import serviceListingsRoutes from './serviceListings.routes.js';

const router = Router();

router.use(authenticateUser, authorizeRoles(['VENDOR']));

// Shared across all vendor types (travel agents + property owners + future).
router.use('/', vendorRoutes);
router.use('/leads', leadsRoutes);
router.use('/offerings', offeringsRoutes);
router.use('/credits', creditsRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/service-listings', serviceListingsRoutes);

export default router;
