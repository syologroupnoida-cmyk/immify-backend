const { findUserById, updateUser } = require('../../repositories/user.repository');
const { sanitizeUser } = require('./_helpers');
const ApiError = require('../../utils/ApiError');

const KYC_NEXT_STEP = {
  PENDING: 'COMPLETE_KYC',
  SUBMITTED: 'AWAITING_APPROVAL',
  REJECTED: 'RESUBMIT_KYC',
  APPROVED: 'DASHBOARD',
};

const getMe = async (userId) => {
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const sanitized = sanitizeUser(user);

  if (user.role === 'VENDOR' && user.vendorProfile) {
    sanitized.vendorType = user.vendorProfile.vendorType;
    sanitized.kycStatus = user.vendorProfile.kycStatus;
    sanitized.nextStep = KYC_NEXT_STEP[user.vendorProfile.kycStatus] || 'COMPLETE_KYC';
  }

  return sanitized;
};

const updateProfile = async (userId, { firstName, lastName, phone, avatarUrl }) => {
  const data = {};
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (phone !== undefined) data.phone = phone;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

  const user = await updateUser(userId, data);
  return sanitizeUser(user);
};

module.exports = { getMe, updateProfile };
