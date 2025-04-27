const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Verifies JWT token in Authorization header
 * Sets req.user if token is valid
 * Returns 401 if token is missing or invalid
 */
const authMiddleware = (req, res, next) => {
  // Get the auth header
  const authHeader = req.headers.authorization;
  
  // Check if auth header exists and has the correct format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing or invalid token format.' });
  }
  
  try {
    // Extract token from header (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);
    
    // Verify the token using the same secret used for signing
    const JWT_SECRET = process.env.JWT_SECRET || 'w+r8fKxcxkfOHYfSZb2olsx8q6DAQqhcjU0SgVIIUxA='; // Must match the secret in server.js
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set user info in request object for use in route handlers
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    // Proceed to next middleware or route handler
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    
    // Different error responses based on the error type
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Authentication token expired. Please log in again.' });
    }
    
    return res.status(401).json({ error: 'Authentication failed. Invalid token.' });
  }
};

module.exports = authMiddleware;