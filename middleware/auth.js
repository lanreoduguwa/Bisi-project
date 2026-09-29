const jwt = require('jsonwebtoken');

// Protects admin routes: valid, unexpired token cookie required, or 401.
module.exports = function auth(req, res, next) {
  try {
    jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};