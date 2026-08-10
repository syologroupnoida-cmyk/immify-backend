const { comparePassword } = require('../../utils/password');
const { issueTokenPair, sanitizeUser, sendOtpEmail } = require('./_helpers');
const { findUserByEmail } = require('../../repositories/user.repository');
const { createEmailOtp } = require('../../repositories/emailOtp.repository');
const { generateOtp, hashOtp, otpExpiry } = require('../../utils/otp');
const { env } = require('../../config/env');
const ApiError = require('../../utils/ApiError');

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const loginUser = async (res, { email, password }) => {
  const user = await findUserByEmail(email);
  if (!user) throw ApiError.unauthorized('Invalid email or password.');

  const passwordMatches = await comparePassword(password, user.password);
  if (!passwordMatches) throw ApiError.unauthorized('Invalid email or password.');

  if (!user.isActive) {
    if (user.role === 'VENDOR' && user.vendorProfile?.kycStatus === 'SUBMITTED') {
      throw ApiError.forbidden('Your application is under review. We will notify you once it is approved.');
    }
    throw ApiError.forbidden('Your account has been deactivated.');
  }

  if (!user.emailVerifiedAt) {
    const otpCode = generateOtp(env.OTP_LENGTH);
    await createEmailOtp({ userId: user.id, codeHash: hashOtp(otpCode), purpose: 'EMAIL_VERIFICATION', expiresAt: otpExpiry(env.OTP_TTL_MINUTES) });
    await sendOtpEmail(user.email, otpCode, 'EMAIL_VERIFICATION');
    throw ApiError.forbidden('EMAIL_NOT_VERIFIED', { code: 'EMAIL_NOT_VERIFIED' });
  }

  const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  const tokenPair = await issueTokenPair(res, user, refreshExpiresAt);

  return {
    user: sanitizeUser(user),
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    refreshExpiresAt: tokenPair.refreshExpiresAt,
  };
};

module.exports = { loginUser, REFRESH_TTL_MS };
