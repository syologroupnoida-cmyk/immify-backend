const { prisma } = require('../config/prisma');

const createEmailOtp = async ({ userId, codeHash, purpose, expiresAt }) => prisma.emailOtp.create({ data: { userId, codeHash, purpose, expiresAt } });

const findLatestOtp = async (userId, purpose) => prisma.emailOtp.findFirst({ where: { userId, purpose }, orderBy: { createdAt: 'desc' } });

const updateEmailOtp = async (id, data) => prisma.emailOtp.update({ where: { id }, data });

module.exports = { createEmailOtp, findLatestOtp, updateEmailOtp };
