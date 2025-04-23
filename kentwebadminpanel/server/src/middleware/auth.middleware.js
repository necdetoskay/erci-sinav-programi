import { AppError } from './error.middleware.js';
import { verifyToken, extractToken } from '../utils/jwt.js';
import { User, Role, Permission } from '../models/index.js';

/**
 * Protect routes - Require user to be logged in
 */
export const protect = async (req, res, next) => {
  try {
    // 1) Get token
    const token = extractToken(req);
    if (!token) {
      return next(new AppError('Please log in to access this resource', 401));
    }

    // 2) Verify token
    const decoded = verifyToken(token);

    // 3) Check if user still exists
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
      include: [
        { 
          model: Role,
          through: { attributes: [] },
          include: [
            {
              model: Permission,
              through: { attributes: [] }
            }
          ]
        },
        {
          model: Permission,
          through: { attributes: [] }
        }
      ]
    });

    if (!user) {
      return next(
        new AppError('The user belonging to this token no longer exists', 401)
      );
    }

    // 4) Check if user is active
    if (user.status !== 'active') {
      return next(
        new AppError('This user account has been deactivated', 401)
      );
    }

    // 5) Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restrict access to certain roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if user has any of the specified roles
    const userRoles = req.user.roles.map(role => role.name);
    
    if (!roles.some(role => userRoles.includes(role))) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    
    next();
  };
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (resource, action) => {
  return (req, res, next) => {
    // Get all user permissions (direct + from roles)
    const directPermissions = req.user.permissions || [];
    const rolePermissions = req.user.roles.flatMap(role => role.permissions || []);
    const allPermissions = [...directPermissions, ...rolePermissions];
    
    // Check if user has the required permission
    const hasRequiredPermission = allPermissions.some(permission => {
      // Check for specific permission
      if (permission.resource === resource && permission.action === action) {
        return true;
      }
      
      // Check for manage permission for the resource
      if (permission.resource === resource && permission.action === 'manage') {
        return true;
      }
      
      // Check for wildcard permission
      if (permission.resource === '*' && permission.action === 'manage') {
        return true;
      }
      
      return false;
    });
    
    if (!hasRequiredPermission) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    
    next();
  };
}; 