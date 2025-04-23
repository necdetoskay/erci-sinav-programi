import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';
import { User, Role, Permission } from '../models/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';

/**
 * Register a new user
 */
export const register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, password_confirm } = req.body;

    logger.info(`Register isteği alındı: ${email}`);

    // Check if passwords match
    if (password !== password_confirm) {
      logger.warn(`Başarısız kayıt: şifreler eşleşmiyor - ${email}`);
      return next(new AppError('Passwords do not match', 400));
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logger.warn(`Başarısız kayıt: email zaten kullanımda - ${email}`);
      return next(new AppError('Email already in use', 400));
    }

    // Create new user
    logger.info(`Yeni kullanıcı oluşturuluyor: ${email}`);
    const user = await User.create({
      first_name,
      last_name,
      email,
      password,
      status: 'active'
    });

    // Remove password from response
    const userJSON = user.toJSON();
    delete userJSON.password;

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    user.refresh_token = refreshToken;
    await user.save();

    logger.info(`Kayıt başarılı: ${email}`);

    res.status(201).json({
      status: 'success',
      data: {
        user: userJSON,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Log login attempt
    logger.info(`Login isteği alındı: ${email}`);

    // Check if email and password exist
    if (!email || !password) {
      logger.warn(`Eksik kimlik bilgileri: email veya şifre girilmedi`);
      return next(new AppError('Please provide email and password', 400));
    }

    // Find user by email
    const user = await User.findOne({ 
      where: { email },
      include: [{
        model: Role,
        include: [Permission]
      }]
    });
    
    if (!user) {
      logger.warn(`Başarısız giriş: kullanıcı bulunamadı - ${email}`);
      return next(new AppError('Invalid credentials', 401));
    }

    // Log user info for debugging
    logger.info(`User found: ${JSON.stringify({
      id: user.id,
      email: user.email,
      status: user.status,
      passwordLength: user.password?.length
    })}`);

    // Check if password is correct
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        logger.warn(`Başarısız giriş: geçersiz şifre - ${email}`);
        return next(new AppError('Invalid credentials', 401));
      }
    } catch (error) {
      logger.error(`Password comparison error: ${error.message}`);
      return next(new AppError('Authentication error', 500));
    }

    // Check if user is active
    if (user.status !== 'active') {
      logger.warn(`Başarısız giriş: deaktif hesap - ${email}`);
      return next(new AppError('Your account has been deactivated', 401));
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token and update last login
    user.refresh_token = refreshToken;
    user.last_login = new Date();
    await user.save();

    // Remove password from response
    const userJSON = user.toJSON();
    delete userJSON.password;

    // Create a simplified user object for the frontend
    const userResponse = {
      id: userJSON.id,
      email: userJSON.email,
      name: `${userJSON.first_name} ${userJSON.last_name}`,
      roles: userJSON.roles ? userJSON.roles.map(r => r.name) : ['user'],
      role: userJSON.roles && userJSON.roles.length > 0 ? userJSON.roles[0].name : 'user'
    };

    logger.info(`Başarılı giriş: ${email}`);
    
    res.status(200).json({
      status: 'success',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    // Find user by id and refresh token
    const user = await User.findOne({
      where: {
        id: decoded.id,
        refresh_token: refreshToken
      }
    });

    if (!user) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }

    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token in database
    user.refresh_token = newRefreshToken;
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user - invalidate refresh token
 */
export const logout = async (req, res, next) => {
  try {
    // Clear refresh token in database
    req.user.refresh_token = null;
    await req.user.save();

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - send reset token
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide your email address', 400));
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new AppError('No user found with this email', 404));
    }

    // Generate password reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    // In a real app, you would send an email here
    // For now, we'll just log the token and return it in the response
    logger.info(`Password reset token: ${resetToken}`);

    res.status(200).json({
      status: 'success',
      message: 'Password reset token sent successfully',
      data: {
        resetToken // In production, don't return this, just send it via email
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using reset token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password, password_confirm } = req.body;

    if (!token || !password || !password_confirm) {
      return next(new AppError('Missing required fields', 400));
    }

    if (password !== password_confirm) {
      return next(new AppError('Passwords do not match', 400));
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by reset token and check if token has expired
    const user = await User.findOne({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: {
          [Op.gt]: Date.now()
        }
      }
    });

    if (!user) {
      return next(new AppError('Invalid or expired reset token', 400));
    }

    // Update password and clear reset token
    user.password = password;
    user.password_reset_token = null;
    user.password_reset_expires = null;
    await user.save();

    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    user.refresh_token = refreshToken;
    await user.save();

    // Remove password from response
    const userJSON = user.toJSON();
    delete userJSON.password;

    res.status(200).json({
      status: 'success',
      data: {
        user: userJSON,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user password
 */
export const updatePassword = async (req, res, next) => {
  try {
    const { current_password, new_password, new_password_confirm } = req.body;

    // Check if all required fields are provided
    if (!current_password || !new_password || !new_password_confirm) {
      return next(new AppError('Missing required fields', 400));
    }

    // Check if new passwords match
    if (new_password !== new_password_confirm) {
      return next(new AppError('New passwords do not match', 400));
    }

    // Get user with password
    const user = await User.findByPk(req.user.id);

    // Check if current password is correct
    const isPasswordValid = await user.correctPassword(current_password);
    if (!isPasswordValid) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.password = new_password;
    await user.save();

    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    user.refresh_token = refreshToken;
    await user.save();

    // Remove password from response
    const userJSON = user.toJSON();
    delete userJSON.password;

    res.status(200).json({
      status: 'success',
      data: {
        user: userJSON,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
}; 