const { signAccessToken, signRefreshToken, hashToken } = require('../../utils/jwt');
const { setRefreshCookie } = require('../../utils/cookies');
const { createRefreshToken } = require('../../repositories/refreshToken.repository');
const { sendMail } = require('../../utils/mailer');
const { env, isDevelopment } = require('../../config/env');

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, googleId, refreshTokens, emailOtps, ...rest } = user;
  return rest;
};

const resolveVendorType = (user) => (user.role === 'VENDOR' ? user.vendorProfile?.vendorType : undefined);

const issueTokenPair = async (res, user, refreshExpiresAt) => {
  const vendorType = resolveVendorType(user);
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    ...(vendorType ? { vendorType } : {}),
  });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  const refreshTokenHash = hashToken(refreshToken);

  await createRefreshToken({ token: refreshTokenHash, userId: user.id, expiresAt: refreshExpiresAt });
  setRefreshCookie(res, refreshToken, refreshExpiresAt);

  return { accessToken, refreshToken, refreshExpiresAt };
};

const sendOtpEmail = async (email, code, purpose) => {
  if (isDevelopment) console.log(`[otp] ${purpose || 'OTP'} code for ${email}: ${code}`);
  const subject = purpose === 'PASSWORD_RESET' ? 'Your password reset code' : 'Verify your email';
  await sendMail({
    to: email,
    subject,
    text: `Your verification code is ${code}. It expires in ${env.OTP_TTL_MINUTES} minutes.`,
    html: `<p>Your verification code is <strong>${code}</strong>. It expires in ${env.OTP_TTL_MINUTES} minutes.</p>`,
  });
  return true;
};

const sendPasswordChangedEmail = async (email) => {
  sendMail({
    to: email,
    subject: 'Your password was changed',
    text: 'Your account password was just changed. If this was not you, contact support immediately.',
    html: '<p>Your account password was just changed. If this was not you, contact support immediately.</p>',
  }).catch(() => {});
};

module.exports = { sanitizeUser, resolveVendorType, issueTokenPair, sendOtpEmail, sendPasswordChangedEmail };
