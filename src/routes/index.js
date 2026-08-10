const express = require('express');
const authRoutes = require('./auth.routes');
const subscriptionRoutes = require('./subscription.routes');
const serviceRoutes = require('./service.routes');
const leadRoutes = require('./lead.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({ ok: true, message: 'Emmify API' });
});

router.use('/auth', authRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/services', serviceRoutes);
router.use('/leads', leadRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
