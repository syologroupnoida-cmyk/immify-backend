const { ZodError } = require('zod');

module.exports = (schema) => (req, _res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const error = new Error('Validation failed');
      error.status = 400;
      error.details = parsed.error.issues;
      return next(error);
    }
    req.body = parsed.data;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const normalizedError = new Error('Validation failed');
      normalizedError.status = 400;
      normalizedError.details = error.issues;
      return next(normalizedError);
    }
    next(error);
  }
};
