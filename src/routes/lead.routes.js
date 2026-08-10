const express = require('express');
const leadController = require('../controllers/lead.controller');
const { authenticateUser } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/global', authenticateUser, leadController.createGlobalLead);
router.post('/direct', authenticateUser, leadController.createDirectLead);

module.exports = router;
