const { prisma } = require('../config/prisma');

const createUser = async ({ id, firstName, lastName, email, phone, password, role, authProvider, googleId, avatarUrl, emailVerifiedAt }) => {
  return prisma.user.create({
    data: {
      id,
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      authProvider,
      googleId,
      avatarUrl,
      emailVerifiedAt: emailVerifiedAt || null,
    },
    include: { vendorProfile: true },
  });
};

const findUserByEmail = async (email) => prisma.user.findUnique({ where: { email }, include: { vendorProfile: true } });
const findUserByPhone = async (phone) => prisma.user.findUnique({ where: { phone } });
const findUserByGoogleId = async (googleId) => prisma.user.findUnique({ where: { googleId }, include: { vendorProfile: true } });
const findUserById = async (id) => prisma.user.findUnique({ where: { id }, include: { vendorProfile: true } });

const updateUser = async (id, data) => prisma.user.update({ where: { id }, data, include: { vendorProfile: true } });

module.exports = { createUser, findUserByEmail, findUserByPhone, findUserByGoogleId, findUserById, updateUser };
