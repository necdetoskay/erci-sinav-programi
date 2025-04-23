import logger from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  // Log request details
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    headers: req.headers,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Calculate response time
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    logger[logLevel](`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      responseTime: duration,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage
    });
  });

  next();
}; 