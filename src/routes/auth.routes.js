const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticateUser } = require('../middlewares/auth.middleware');
const validateMiddleware = require('../middlewares/validate.middleware');
const { createRateLimit } = require('../middlewares/rateLimit.middleware');
const { registerSchema, loginSchema, refreshTokenSchema, verifyEmailSchema, forgotPasswordSchema, verifyResetOtpSchema, resetPasswordSchema, googleLoginSchema, updateProfileSchema, changePasswordSchema } = require('../validators/auth.validator');

const router = express.Router();
const loginLimiter = createRateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many login attempts', code: 'AUTH_RATE_LIMIT' });
const registerLimiter = createRateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many registrations', code: 'AUTH_RATE_LIMIT' });

router.post('/register', registerLimiter, validateMiddleware(registerSchema), authController.register);
router.post('/login', loginLimiter, validateMiddleware(loginSchema), authController.login);
router.post('/refresh', validateMiddleware(refreshTokenSchema), authController.refresh);
router.post('/logout', validateMiddleware(refreshTokenSchema), authController.logout);
router.get('/me', authenticateUser, authController.getMe);
router.post('/verify-email', validateMiddleware(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-otp', validateMiddleware(forgotPasswordSchema), authController.resendOtp);
router.post('/password/forgot', validateMiddleware(forgotPasswordSchema), authController.forgotPassword);
router.post('/password/verify-otp', validateMiddleware(verifyResetOtpSchema), authController.verifyResetOtp);
router.post('/password/reset', validateMiddleware(resetPasswordSchema), authController.resetPassword);
router.post('/change-password', authenticateUser, validateMiddleware(changePasswordSchema), authController.changePassword);
router.post('/google/login', validateMiddleware(googleLoginSchema), authController.googleLogin);
router.patch('/me', authenticateUser, validateMiddleware(updateProfileSchema), authController.updateProfile);

module.exports = router;
