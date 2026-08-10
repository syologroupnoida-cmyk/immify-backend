const express = require('express');
const subscriptionController = require('../controllers/subscription.controller');
const { authenticateUser } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/plans', subscriptionController.listPlans);
router.post('/subscribe', authenticateUser, subscriptionController.subscribe);

module.exports = router;
