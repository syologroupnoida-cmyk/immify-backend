const crypto = require('crypto');
const { env } = require('../config/env');

const generateOtp = (length = env.OTP_LENGTH) => {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    const index = crypto.randomInt(0, digits.length);
    code += digits[index];
  }
  return code;
};

const hashOtp = (code) => crypto.createHash('sha256').update(code).digest('hex');

const otpExpiry = (minutes = env.OTP_TTL_MINUTES) => new Date(Date.now() + minutes * 60 * 1000);

module.exports = { generateOtp, hashOtp, otpExpiry };
