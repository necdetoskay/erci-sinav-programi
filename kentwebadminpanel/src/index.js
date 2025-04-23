import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import roleRoutes from './routes/role.routes.js';
import permissionRoutes from './routes/permission.routes.js';

// Middleware
import { globalErrorHandler } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logger.middleware.js';

// Utilities
import logger from './utils/logger.js';
import { connectDB } from './db/connection.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Set up middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('combined')); // HTTP request logger
app.use(requestLogger); // Custom request logger

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(apiLimiter);

// API routes
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/roles`, roleRoutes);
app.use(`${API_PREFIX}/permissions`, permissionRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is up and running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use(globalErrorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Set port and start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    // Connect to the database
    const db = await connectDB();
    if (db) {
      logger.info(`✅ Database connected successfully`);
    } else {
      logger.warn(`⚠️ Application running without database connection. Some features may not work.`);
    }
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err);
  // Close server & exit process
  process.exit(1);
});

export default app; 