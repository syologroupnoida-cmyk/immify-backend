const { prisma } = require('../config/prisma');

exports.listPlans = async () => prisma.subscriptionPlan.findMany({ where: { isActive: true } });

exports.createSubscription = async (user, payload) => {
  return {
    message: 'Subscription flow stub',
    userId: user.sub,
    planCode: payload.planCode,
  };
};
