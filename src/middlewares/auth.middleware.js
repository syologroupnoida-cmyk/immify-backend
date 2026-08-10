const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');
const { findVendorProfileByUserId } = require('../repositories/vendorProfile.repository');

const extractBearerToken = (req) => {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

const authenticateUser = (req, _res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    return next(ApiError.unauthorized('Authentication token missing or malformed.'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'api', audience: 'clients' });
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      vendorType: payload.vendorType,
    };
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Access token has expired.'));
    }
    return next(ApiError.unauthorized('Invalid access token.'));
  }
};

const optionalAuthenticateUser = (req, _res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    req.user = undefined;
    return next();
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'api', audience: 'clients' });
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      vendorType: payload.vendorType,
    };
  } catch (_error) {
    req.user = undefined;
  }

  return next();
};

const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication token missing or malformed.'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Access denied. Required role(s): ${allowedRoles.join(', ')}`));
  }

  return next();
};

const requireVendorType = (...allowedTypes) => (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication token missing or malformed.'));
  }

  if (req.user.role !== 'VENDOR') {
    return next(ApiError.forbidden('This action is available to vendors only.'));
  }

  if (!allowedTypes.includes(req.user.vendorType)) {
    return next(ApiError.forbidden('Vendor type mismatch', { code: 'VENDOR_TYPE_MISMATCH', required: allowedTypes, current: req.user.vendorType }));
  }

  return next();
};

const requireKycApproved = async (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication token missing or malformed.'));
  }

  if (req.user.role !== 'VENDOR') {
    return next();
  }

  try {
    const vendorProfile = await findVendorProfileByUserId(req.user.id);
    if (!vendorProfile || vendorProfile.kycStatus !== 'APPROVED') {
      return next(ApiError.forbidden('KYC approval required for this action.', { code: 'KYC_REQUIRED', kycStatus: vendorProfile?.kycStatus || 'PENDING' }));
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { authenticateUser, optionalAuthenticateUser, authorizeRoles, requireVendorType, requireKycApproved };
