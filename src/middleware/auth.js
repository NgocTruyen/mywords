import jwt from 'jsonwebtoken';
import config from '../../config/config.js';

// Ensure JWT secret exists
const JWT_SECRET = config.jwtSecret || 'mywords-secret-key-change-in-production';

/**
 * Middleware to verify JWT token
 * Attaches user info to req.user if valid
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication - attaches user if token exists, but doesn't require it
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
    } catch (error) {
      // Token invalid, but continue without user
    }
  }
  next();
}

export default { authenticateToken, optionalAuth };
