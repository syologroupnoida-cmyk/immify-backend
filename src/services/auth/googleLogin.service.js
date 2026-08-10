const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { env } = require('../../config/env');
const { findUserByGoogleId, findUserByEmail, createUser, updateUser } = require('../../repositories/user.repository');
const { createVendorProfile } = require('../../repositories/vendorProfile.repository');
const { issueTokenPair, sanitizeUser } = require('./_helpers');
const { REFRESH_TTL_MS } = require('./login.service');
const ApiError = require('../../utils/ApiError');

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const ID_PREFIXES = { VENDOR: 'VEND', ADMIN: 'ADMIN', SUPER_ADMIN: 'SUPER', CLIENT: 'CLIENT' };
const MAX_ID_RETRIES = 5;
const generateUserId = (role) => `${ID_PREFIXES[role] || 'CLIENT'}-${String(crypto.randomInt(0, 999999)).padStart(6, '0')}`;

const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    return ticket.getPayload();
  } catch (error) {
    throw ApiError.unauthorized('Invalid Google token.');
  }
};

const googleLogin = async (res, { token, role, vendorType }) => {
  const payload = await verifyGoogleToken(token);

  if (!payload?.email_verified) {
    throw ApiError.unauthorized('Google account email is not verified.');
  }

  const googleId = payload.sub;
  const email = payload.email;

  let user = await findUserByGoogleId(googleId);

  if (!user) {
    user = await findUserByEmail(email);
    if (user) {
      user = await updateUser(user.id, { googleId, authProvider: 'HYBRID' });
    }
  }

  if (!user) {
    if (!role) throw ApiError.badRequest('Role is required for new account registration.', { code: 'ROLE_REQUIRED' });

    let created;
    for (let attempt = 0; attempt < MAX_ID_RETRIES; attempt += 1) {
      try {
        created = await createUser({
          id: generateUserId(role),
          firstName: payload.given_name || '',
          lastName: payload.family_name || '',
          email,
          phone: null,
          password: null,
          role,
          authProvider: 'GOOGLE',
          googleId,
          avatarUrl: payload.picture,
          emailVerifiedAt: new Date(),
        });
        break;
      } catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('id') && attempt < MAX_ID_RETRIES - 1) continue;
        throw error;
      }
    }
    user = created;

    if (role === 'VENDOR') {
      user.vendorProfile = await createVendorProfile({ userId: user.id, vendorType: vendorType || 'TRAVEL_AGENT' });
    }
  }

  if (!user.isActive) {
    if (user.role === 'VENDOR' && user.vendorProfile?.kycStatus === 'SUBMITTED') {
      throw ApiError.forbidden('Your application is under review. We will notify you once it is approved.');
    }
    throw ApiError.forbidden('Your account has been deactivated.');
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

module.exports = { googleLogin };
