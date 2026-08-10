const { prisma } = require('../config/prisma');

const createVendorProfile = async ({ userId, vendorType, companyName, phone }) =>
  prisma.vendorProfile.create({ data: { userId, vendorType, companyName, phone } });

const findVendorProfileByUserId = async (userId) => prisma.vendorProfile.findUnique({ where: { userId } });

const updateVendorProfile = async (userId, data) => prisma.vendorProfile.update({ where: { userId }, data });

module.exports = { createVendorProfile, findVendorProfileByUserId, updateVendorProfile };
