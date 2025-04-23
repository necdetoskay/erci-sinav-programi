import logger from '../utils/logger.js';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle errors in development environment
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

/**
 * Handle errors in production environment
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err);

    res.status(500).json({
      status: 'error',
      message: 'Bir şeyler yanlış gitti'
    });
  }
};

/**
 * Handle database validation errors
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Geçersiz giriş verisi. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle database duplicated field errors
 */
const handleDuplicateFieldsError = (err) => {
  const message = `Yinelenen alan değeri: ${err.original.detail}. Lütfen başka bir değer kullanın.`;
  return new AppError(message, 400);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => new AppError('Geçersiz token. Lütfen tekrar giriş yapın.', 401);

/**
 * Handle JWT expired errors
 */
const handleJWTExpiredError = () => new AppError('Token süresi doldu. Lütfen tekrar giriş yapın.', 401);

/**
 * Global error handling middleware
 */
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle database validation errors
    if (err.name === 'SequelizeValidationError') error = handleValidationError(err);
    
    // Handle database unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') error = handleDuplicateFieldsError(err);
    
    // Handle JWT invalid token errors
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    
    // Handle JWT expired token errors
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
}; 