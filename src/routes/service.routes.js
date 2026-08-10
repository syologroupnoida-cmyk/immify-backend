const express = require('express');
const serviceController = require('../controllers/service.controller');
const { authenticateUser } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/categories', authenticateUser, serviceController.createCategory);
router.get('/categories', serviceController.listCategories);

module.exports = router;
