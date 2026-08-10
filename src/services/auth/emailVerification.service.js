const { env } = require('../../config/env');
const { hashOtp, generateOtp, otpExpiry } = require('../../utils/otp');
const { findLatestOtp, updateEmailOtp, createEmailOtp } = require('../../repositories/emailOtp.repository');
const { findUserByEmail, updateUser } = require('../../repositories/user.repository');
const { sendOtpEmail } = require('./_helpers');
const ApiError = require('../../utils/ApiError');

const GENERIC_MESSAGE = 'If an account exists for that email, a code has been sent.';

const resendOtp = async (res, { email }) => {
  const user = await findUserByEmail(email);
  if (!user || user.emailVerifiedAt) return { message: GENERIC_MESSAGE };

  const lastOtp = await findLatestOtp(user.id, 'EMAIL_VERIFICATION');
  if (lastOtp) {
    const secondsSinceLast = (Date.now() - lastOtp.createdAt.getTime()) / 1000;
    if (secondsSinceLast < env.OTP_RESEND_COOLDOWN_SECONDS) {
      const retryAfterSeconds = Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast);
      res.setHeader('Retry-After', retryAfterSeconds);
      throw new ApiError(429, 'Please wait before requesting another code.', { code: 'RESEND_COOLDOWN', retryAfterSeconds });
    }
  }

  const otpCode = generateOtp(env.OTP_LENGTH);
  await createEmailOtp({ userId: user.id, codeHash: hashOtp(otpCode), purpose: 'EMAIL_VERIFICATION', expiresAt: otpExpiry(env.OTP_TTL_MINUTES) });
  await sendOtpEmail(user.email, otpCode, 'EMAIL_VERIFICATION');

  return { message: GENERIC_MESSAGE };
};

const verifyEmail = async ({ email, code }) => {
  const user = await findUserByEmail(email);
  if (!user) throw ApiError.notFound('User not found');

  const otp = await findLatestOtp(user.id, 'EMAIL_VERIFICATION');
  if (!otp || otp.consumedAt) throw ApiError.badRequest('No verification OTP found. Please request a new code.');
  if (otp.expiresAt < new Date()) throw ApiError.badRequest('This code has expired. Please request a new code.');

  if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
    await updateEmailOtp(otp.id, { consumedAt: new Date() });
    throw ApiError.forbidden('Too many attempts. Please request a new code.');
  }

  const hashedInput = hashOtp(code);
  if (hashedInput !== otp.codeHash) {
    await updateEmailOtp(otp.id, { attempts: otp.attempts + 1 });
    throw ApiError.badRequest('Invalid verification code');
  }

  await updateEmailOtp(otp.id, { consumedAt: new Date() });
  await updateUser(user.id, { emailVerifiedAt: new Date() });

  return { message: 'Email verified successfully' };
};

module.exports = { verifyEmail, resendOtp };
