const { registerUser } = require('../services/auth/registration.service');
const { loginUser } = require('../services/auth/login.service');
const { verifyEmail, resendOtp } = require('../services/auth/emailVerification.service');
const { refreshTokens, logoutUser } = require('../services/auth/tokens.service');
const { forgotPassword, verifyResetOtp, resetPassword, changePassword } = require('../services/auth/passwordReset.service');
const { googleLogin } = require('../services/auth/googleLogin.service');
const { getMe, updateProfile } = require('../services/auth/profile.service');
const { readRefreshToken } = require('../utils/cookies');
const { sendSuccess } = require('../utils/response');

exports.register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    return sendSuccess(res, { statusCode: 201, message: result.message, data: result.user });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const result = await loginUser(res, req.body);
    return sendSuccess(res, { statusCode: 200, message: 'Login successful', data: result });
  } catch (error) {
    return next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = readRefreshToken(req);
    const result = await refreshTokens(res, token);
    return sendSuccess(res, { statusCode: 200, message: 'Token refreshed', data: result });
  } catch (error) {
    return next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = readRefreshToken(req);
    const result = await logoutUser(res, token);
    return sendSuccess(res, { statusCode: 200, message: result.message, data: null });
  } catch (error) {
    return next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const result = await getMe(req.user.id);
    return sendSuccess(res, { statusCode: 200, message: 'User profile', data: result });
  } catch (error) {
    return next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const result = await verifyEmail(req.body);
    return sendSuccess(res, { statusCode: 200, message: result.message, data: null });
  } catch (error) {
    return next(error);
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const result = await resendOtp(res, req.body);
    return sendSuccess(res, { statusCode: 200, message: result.message, data: null });
  } catch (error) {
    return next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const result = await forgotPassword(res, req.body);
    return sendSuccess(res, { statusCode: 200, message: result.message, data: null });
  } catch (error) {
    return next(error);
  }
};

exports.verifyResetOtp = async (req, res, next) => {
  try {
    const result = await verifyResetOtp(req.body);
    return sendSuccess(res, { statusCode: 200, message: 'Code verified', data: result });
  } catch (error) {
    return next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const result = await resetPassword(req.body);
    return sendSuccess(res, { statusCode: 200, message: result.message, data: null });
  } catch (error) {
    return next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const result = await changePassword(req.user.id, req.body);
    return sendSuccess(res, { statusCode: 200, message: result.message, data: null });
  } catch (error) {
    return next(error);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const result = await googleLogin(res, req.body);
    return sendSuccess(res, { statusCode: 200, message: 'Login successful', data: result });
  } catch (error) {
    return next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const result = await updateProfile(req.user.id, req.body);
    return sendSuccess(res, { statusCode: 200, message: 'Profile updated', data: result });
  } catch (error) {
    return next(error);
  }
};
