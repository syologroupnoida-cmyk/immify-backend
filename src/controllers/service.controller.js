const serviceService = require('../services/service.service');

exports.createCategory = async (req, res, next) => {
  try {
    const category = await serviceService.createCategory(req.body);
    res.status(201).json({ ok: true, data: category });
  } catch (error) {
    next(error);
  }
};

exports.listCategories = async (_req, res, next) => {
  try {
    const categories = await serviceService.listCategories();
    res.json({ ok: true, data: categories });
  } catch (error) {
    next(error);
  }
};
