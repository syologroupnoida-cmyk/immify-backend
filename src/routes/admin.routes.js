const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/ping', authenticateUser, authorizeRoles('SUPER_ADMIN', 'ADMIN'), (_req, res) => {
  res.json({ ok: true, message: 'Admin access granted' });
});

module.exports = router;
