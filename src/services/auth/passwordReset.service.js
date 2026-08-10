const { env } = require('../../config/env');
const { hashPassword, comparePassword } = require('../../utils/password');
const { generateOtp, hashOtp, otpExpiry } = require('../../utils/otp');
const { signPasswordResetToken, verifyPasswordResetToken } = require('../../utils/jwt');
const { findLatestOtp, createEmailOtp, updateEmailOtp } = require('../../repositories/emailOtp.repository');
const { findUserByEmail, findUserById, updateUser } = require('../../repositories/user.repository');
const { revokeAllRefreshTokensForUser } = require('../../repositories/refreshToken.repository');
const { sendOtpEmail, sendPasswordChangedEmail } = require('./_helpers');
const ApiError = require('../../utils/ApiError');

const GENERIC_MESSAGE = 'If an account exists for that email, a code has been sent.';

const forgotPassword = async (res, { email }) => {
  const user = await findUserByEmail(email);
  if (!user) return { message: GENERIC_MESSAGE };

  const lastOtp = await findLatestOtp(user.id, 'PASSWORD_RESET');
  if (lastOtp) {
    const secondsSinceLast = (Date.now() - lastOtp.createdAt.getTime()) / 1000;
    if (secondsSinceLast < env.OTP_RESEND_COOLDOWN_SECONDS) {
      const retryAfterSeconds = Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast);
      res.setHeader('Retry-After', retryAfterSeconds);
      throw new ApiError(429, 'Please wait before requesting another code.', { code: 'RESEND_COOLDOWN', retryAfterSeconds });
    }
  }

  const otpCode = generateOtp(env.OTP_LENGTH);
  await createEmailOtp({ userId: user.id, codeHash: hashOtp(otpCode), purpose: 'PASSWORD_RESET', expiresAt: otpExpiry(env.OTP_TTL_MINUTES) });
  await sendOtpEmail(user.email, otpCode, 'PASSWORD_RESET');

  return { message: GENERIC_MESSAGE };
};

const verifyResetOtp = async ({ email, code }) => {
  const user = await findUserByEmail(email);
  if (!user) throw ApiError.badRequest('Invalid or expired code.');

  const otp = await findLatestOtp(user.id, 'PASSWORD_RESET');
  if (!otp || otp.consumedAt || otp.expiresAt < new Date()) throw ApiError.badRequest('Invalid or expired code.');

  if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
    await updateEmailOtp(otp.id, { consumedAt: new Date() });
    throw ApiError.forbidden('Too many attempts. Please request a new code.');
  }

  if (hashOtp(code) !== otp.codeHash) {
    await updateEmailOtp(otp.id, { attempts: otp.attempts + 1 });
    throw ApiError.badRequest('Invalid or expired code.');
  }

  await updateEmailOtp(otp.id, { consumedAt: new Date() });
  const resetToken = signPasswordResetToken(user.id);

  return { resetToken };
};

const resetPassword = async ({ resetToken, newPassword }) => {
  let payload;
  try {
    payload = verifyPasswordResetToken(resetToken);
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired reset token.');
  }
  if (payload.purpose !== 'PASSWORD_RESET') throw ApiError.unauthorized('Invalid reset token.');

  const user = await findUserById(payload.sub);
  if (!user) throw ApiError.unauthorized('Invalid reset token.');

  const passwordHash = await hashPassword(newPassword);
  await updateUser(user.id, { password: passwordHash });
  await revokeAllRefreshTokensForUser(user.id);
  sendPasswordChangedEmail(user.email);

  return { message: 'Password reset successful' };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const matches = await comparePassword(currentPassword, user.password);
  if (!matches) throw ApiError.unauthorized('Current password is incorrect.');

  const passwordHash = await hashPassword(newPassword);
  await updateUser(user.id, { password: passwordHash });
  sendPasswordChangedEmail(user.email);

  return { message: 'Password changed successfully' };
};

module.exports = { forgotPassword, verifyResetOtp, resetPassword, changePassword };
