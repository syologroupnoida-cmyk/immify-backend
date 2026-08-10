const { isProduction } = require('../config/env');

const REFRESH_COOKIE_NAME = 'refreshToken';

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/api/v1/auth',
});

const setRefreshCookie = (res, token, expiresAt) => {
  res.cookie(REFRESH_COOKIE_NAME, token, { ...baseCookieOptions(), expires: new Date(expiresAt) });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions());
};

const readRefreshToken = (req) => req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken || null;

module.exports = { REFRESH_COOKIE_NAME, setRefreshCookie, clearRefreshCookie, readRefreshToken };
