const { prisma } = require('../config/prisma');

exports.createGlobalLead = async (_user, payload) => {
  return prisma.lead.create({
    data: {
      type: 'GLOBAL',
      status: 'PENDING_ADMIN',
      metadata: payload.metadata || {},
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
};

exports.createDirectLead = async (_user, payload) => {
  return prisma.lead.create({
    data: {
      type: 'DIRECT',
      targetVendorId: payload.targetVendorId,
      status: 'APPROVED',
      metadata: payload.metadata || {},
      priceInCredits: payload.priceInCredits || 10,
    },
  });
};
