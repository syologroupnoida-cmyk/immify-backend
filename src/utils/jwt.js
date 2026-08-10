const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

const signAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: 'api',
    audience: 'clients',
  });
};

const signRefreshToken = (payload) => {
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'api',
    audience: 'clients',
  });
};

const signPasswordResetToken = (userId) => {
  return jwt.sign({ sub: userId, purpose: 'PASSWORD_RESET' }, env.JWT_RESET_SECRET, {
    expiresIn: '10m',
    issuer: 'api',
    audience: 'clients',
  });
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'api', audience: 'clients' });
const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: 'api', audience: 'clients' });
const verifyPasswordResetToken = (token) => jwt.verify(token, env.JWT_RESET_SECRET, { issuer: 'api', audience: 'clients' });

module.exports = {
  signAccessToken,
  signRefreshToken,
  signPasswordResetToken,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyPasswordResetToken,
};
