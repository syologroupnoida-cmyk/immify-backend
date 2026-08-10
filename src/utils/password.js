const bcrypt = require('bcrypt');
const { env } = require('../config/env');

const hashPassword = async (plain) => {
  if (!plain) return null;
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
};

const comparePassword = async (plain, hash) => {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
};

module.exports = { hashPassword, comparePassword };
