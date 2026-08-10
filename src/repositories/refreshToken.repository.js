const { prisma } = require('../config/prisma');

const createRefreshToken = async ({ token, userId, expiresAt }) => prisma.refreshToken.create({ data: { token, userId, expiresAt } });
const findRefreshToken = async (token) => prisma.refreshToken.findUnique({ where: { token } });
const revokeRefreshToken = async (token) => prisma.refreshToken.update({ where: { token }, data: { isRevoked: true } });
const revokeAllRefreshTokensForUser = async (userId) => prisma.refreshToken.updateMany({ where: { userId }, data: { isRevoked: true } });

const rotateRefreshToken = async ({ oldToken, newToken, userId, expiresAt }) =>
  prisma.$transaction([
    prisma.refreshToken.update({ where: { token: oldToken }, data: { isRevoked: true } }),
    prisma.refreshToken.create({ data: { token: newToken, userId, expiresAt } }),
  ]);

module.exports = { createRefreshToken, findRefreshToken, revokeRefreshToken, revokeAllRefreshTokensForUser, rotateRefreshToken };
