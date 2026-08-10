const { env } = require('../config/env');
const { sendError } = require('../utils/response');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return sendError(res, { statusCode: err.statusCode, message: err.message, details: err.details });
  }

  if (err?.name === 'ZodError') {
    return sendError(res, {
      statusCode: 400,
      message: 'Validation failed',
      details: err.issues?.map((issue) => ({ field: issue.path.join('.'), message: issue.message, code: issue.code })) || err.message,
    });
  }

  if (err?.code === 'P2002') {
    return sendError(res, { statusCode: 409, message: 'A record with this value already exists.' });
  }

  if (err?.code === 'P2025') {
    return sendError(res, { statusCode: 404, message: 'Record not found.' });
  }

  if (err?.type === 'entity.parse.failed') {
    return sendError(res, { statusCode: 400, message: 'Malformed JSON body.' });
  }

  console.error(err);
  return sendError(res, {
    statusCode: 500,
    message: env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Internal server error.',
  });
};

module.exports = errorHandler;
