const rateLimit = require('express-rate-limit');

module.exports = {
  loginLimiter: rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  reviewLimiter: rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: 'Too many reviews, try again later' } }),
  checkoutLimiter: rateLimit({ windowMs: 10 * 60 * 1000, max: 20 })
};
