const createRateLimit = ({ windowMs, max, getKey = (req) => req.ip, message = 'Too many requests', code = 'RATE_LIMITED' }) => {
  const hits = new Map();

  return (req, res, next) => {
    const key = getKey(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    const entries = hits.get(key) || [];
    const validEntries = entries.filter((timestamp) => timestamp > windowStart);

    if (validEntries.length >= max) {
      const retryAfterSeconds = Math.ceil((validEntries[0] + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({ success: false, message, errors: [{ code, limit: max, windowSeconds: Math.round(windowMs / 1000), retryAfterSeconds }] });
    }

    validEntries.push(now);
    hits.set(key, validEntries);
    next();
  };
};

module.exports = { createRateLimit };
