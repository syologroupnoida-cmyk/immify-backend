const { verifyRefreshToken, signAccessToken, signRefreshToken, hashToken } = require('../../utils/jwt');
const { setRefreshCookie, clearRefreshCookie } = require('../../utils/cookies');
const {
  findRefreshToken,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
  rotateRefreshToken,
} = require('../../repositories/refreshToken.repository');
const { findUserById } = require('../../repositories/user.repository');
const { sanitizeUser, resolveVendorType } = require('./_helpers');
const ApiError = require('../../utils/ApiError');
const { REFRESH_TTL_MS } = require('./login.service');

const refreshTokens = async (res, rawToken) => {
  if (!rawToken) throw ApiError.unauthorized('Refresh token missing.');

  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch (error) {
    clearRefreshCookie(res);
    if (error.name === 'TokenExpiredError') throw ApiError.unauthorized('Refresh token has expired.');
    throw ApiError.unauthorized('Invalid refresh token.');
  }

  const tokenHash = hashToken(rawToken);
  const stored = await findRefreshToken(tokenHash);

  if (!stored || stored.isRevoked) {
    // Reuse of an already-rotated/revoked token — treat as a replay of a stolen token.
    await revokeAllRefreshTokensForUser(payload.sub);
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Refresh token reuse detected. All sessions have been revoked.');
  }

  const user = await findUserById(payload.sub);
  if (!user || !user.isActive) {
    await revokeRefreshToken(tokenHash);
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Account is no longer active.');
  }

  const vendorType = resolveVendorType(user);
  const newAccessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    ...(vendorType ? { vendorType } : {}),
  });
  const newRefreshToken = signRefreshToken({ sub: user.id, role: user.role });
  const newRefreshTokenHash = hashToken(newRefreshToken);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await rotateRefreshToken({ oldToken: tokenHash, newToken: newRefreshTokenHash, userId: user.id, expiresAt: refreshExpiresAt });
  setRefreshCookie(res, newRefreshToken, refreshExpiresAt);

  return {
    user: sanitizeUser(user),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    refreshExpiresAt,
  };
};

const logoutUser = async (res, rawToken) => {
  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    const stored = await findRefreshToken(tokenHash);
    if (stored) await revokeRefreshToken(tokenHash);
  }
  clearRefreshCookie(res);
  return { message: 'Logged out successfully' };
};

module.exports = { refreshTokens, logoutUser };
