const subscriptionService = require('../services/subscription.service');

exports.listPlans = async (_req, res, next) => {
  try {
    const plans = await subscriptionService.listPlans();
    res.json({ ok: true, data: plans });
  } catch (error) {
    next(error);
  }
};

exports.subscribe = async (req, res, next) => {
  try {
    const result = await subscriptionService.createSubscription(req.user, req.body);
    res.status(201).json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
};
