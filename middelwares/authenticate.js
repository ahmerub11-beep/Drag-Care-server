'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dragcare_super_secret_jwt_key_2026';

const authenticate = (req, res, next) => {
  if (['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'].includes(req.path)) {
    return next();
  }

  const authorization = req.get('Authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Please log in to access this resource' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session is invalid or has expired. Please log in again.' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have permission to access this resource' });
  }
  return next();
};

module.exports = { authenticate, requireRole };
