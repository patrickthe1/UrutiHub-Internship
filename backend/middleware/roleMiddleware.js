/**
 * Role-based authorization middleware factory
 * Creates middleware functions that check if the authenticated user has the required role
 * Returns 403 if user's role doesn't match the required role
 * 
 * @param {string|string[]} requiredRoles - Single role or array of roles that are authorized
 * @returns {function} Middleware function that checks the user's role
 */
const authorizeRole = (requiredRoles) => {
  return (req, res, next) => {
    // Convert single role to array for consistent handling
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // authMiddleware should have run first, so req.user should exist
    // If it doesn't, that means authMiddleware didn't run or didn't set req.user
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Authorization failed. User information not available.' });
    }
    
    // Check if the user's role is in the list of required roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to access this resource.' });
    }
    
    // If role check passed, proceed to the next middleware or route handler
    next();
  };
};

// Pre-configured middleware for common roles
const adminRoleMiddleware = authorizeRole('admin');
const internRoleMiddleware = authorizeRole('intern');

module.exports = {
  authorizeRole,
  adminRoleMiddleware,
  internRoleMiddleware
};