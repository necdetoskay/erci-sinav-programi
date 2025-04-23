import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/error.middleware.js';

/**
 * Generate an access token for a user
 * @param {Object} user - User object
 * @returns {String} Access token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email
    },
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m'
    }
  );
};

/**
 * Generate a refresh token for a user
 * @param {Object} user - User object
 * @returns {String} Refresh token
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d'
    }
  );
};

/**
 * Verify a JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token has expired', 401);
    }
    throw new AppError('Invalid token', 401);
  }
};

/**
 * Extract token from request headers
 * @param {Object} req - Express request object
 * @returns {String|null} Token or null
 */
export const extractToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}; 