const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  try {
    req.admin = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Please sign in.' });
  }
}
module.exports = { requireAdmin };
