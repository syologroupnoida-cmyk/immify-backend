const leadService = require('../services/lead.service');

exports.createGlobalLead = async (req, res, next) => {
  try {
    const lead = await leadService.createGlobalLead(req.user, req.body);
    res.status(201).json({ ok: true, data: lead });
  } catch (error) {
    next(error);
  }
};

exports.createDirectLead = async (req, res, next) => {
  try {
    const lead = await leadService.createDirectLead(req.user, req.body);
    res.status(201).json({ ok: true, data: lead });
  } catch (error) {
    next(error);
  }
};
