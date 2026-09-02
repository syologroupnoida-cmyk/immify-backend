import { Router } from 'express';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import uploadRoutes from './upload.routes.js';
import leadRoutes from './leads.routes.js';
import subscriptionPlanRoutes from './subscriptionPlans.routes.js';
import serviceListingRoutes from './serviceListings.routes.js';
import serviceCategoryRoutes from './serviceCategories.routes.js';
import jobListingRoutes from './jobListings.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/uploads', uploadRoutes);
router.use('/leads', leadRoutes);
router.use('/subscription-plans', subscriptionPlanRoutes);
router.use('/service-listings', serviceListingRoutes);
router.use('/service-categories', serviceCategoryRoutes);
router.use('/job-listings', jobListingRoutes);

export default router;
