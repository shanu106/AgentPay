const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'buying_agent_super_secret_jwt_key_2026';

/**
 * Authentication Middleware
 * Validates JWT Bearer token and attaches user context (req.user)
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token provided, check if email query/body is passed for smooth backwards-compatibility
    const fallbackEmail = req.body?.email || req.query?.email;
    if (fallbackEmail) {
      req.user = { email: fallbackEmail.toLowerCase().trim() };
      return next();
    }
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token is missing.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

module.exports = {
  authenticateToken,
  JWT_SECRET
};
