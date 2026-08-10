const crypto = require('crypto');
const { env } = require('../../config/env');
const { hashPassword } = require('../../utils/password');
const { generateOtp, hashOtp, otpExpiry } = require('../../utils/otp');
const { createEmailOtp } = require('../../repositories/emailOtp.repository');
const { createUser, findUserByEmail, findUserByPhone } = require('../../repositories/user.repository');
const { createVendorProfile } = require('../../repositories/vendorProfile.repository');
const { sendOtpEmail, sanitizeUser } = require('./_helpers');
const ApiError = require('../../utils/ApiError');

const ID_PREFIXES = { VENDOR: 'VEND', ADMIN: 'ADMIN', SUPER_ADMIN: 'SUPER', CLIENT: 'CLIENT' };
const MAX_ID_RETRIES = 5;

const generateUserId = (role) => `${ID_PREFIXES[role] || 'CLIENT'}-${String(crypto.randomInt(0, 999999)).padStart(6, '0')}`;

const registerUser = async ({ firstName, lastName, email, phone, password, role, vendorType }) => {
  const existingEmail = await findUserByEmail(email);
  if (existingEmail) throw ApiError.conflict('A user with this email already exists');

  const existingPhone = phone ? await findUserByPhone(phone) : null;
  if (existingPhone) throw ApiError.conflict('A user with this phone already exists');

  const passwordHash = await hashPassword(password);

  let user;
  for (let attempt = 0; attempt < MAX_ID_RETRIES; attempt += 1) {
    try {
      user = await createUser({
        id: generateUserId(role),
        firstName,
        lastName,
        email,
        phone,
        password: passwordHash,
        role,
        authProvider: 'LOCAL',
      });
      break;
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('id') && attempt < MAX_ID_RETRIES - 1) continue;
      throw error;
    }
  }

  if (role === 'VENDOR') {
    user.vendorProfile = await createVendorProfile({ userId: user.id, vendorType: vendorType || 'TRAVEL_AGENT', phone });
  }

  const otpCode = generateOtp(env.OTP_LENGTH);
  const otpHash = hashOtp(otpCode);
  await createEmailOtp({ userId: user.id, codeHash: otpHash, purpose: 'EMAIL_VERIFICATION', expiresAt: otpExpiry(env.OTP_TTL_MINUTES) });
  await sendOtpEmail(email, otpCode, 'EMAIL_VERIFICATION');

  return {
    user: sanitizeUser(user),
    message: 'Registration successful. Please verify your email.',
  };
};

module.exports = { registerUser };
