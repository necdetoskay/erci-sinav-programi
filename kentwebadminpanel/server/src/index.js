import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Utilities
import logger from './utils/logger.js';
import { connectDB } from './db/connection.js';
import { seedDatabase } from './utils/seed.js';
import { sequelize } from './models/index.js';
import { globalErrorHandler, AppError } from './middleware/error.middleware.js';

// Routes
import bannerRoutes from './routes/banner.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import roleRoutes from './routes/role.routes.js';
import permissionRoutes from './routes/permission.routes.js';

// Load environment variables
dotenv.config();

// ES Modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik dosyalar için uploads klasörünü ayarla
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/banners', bannerRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);

// 404 handler for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`The requested URL ${req.originalUrl} was not found on this server`, 404));
});

// Global error handler
app.use(globalErrorHandler);

// Connect to DB, create tables, and start server
connectDB().then(async () => {
  try {
    // Create database tables based on models
    logger.info('Syncing database models...');
    await sequelize.sync({ alter: true });
    logger.info('Database models synced successfully');
    
    // Initialize database with default data
    try {
      await seedDatabase();
      logger.info('Database seeded successfully');
    } catch (err) {
      logger.error('Error seeding database:', err);
      // Continue even if seeding fails
    }
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Error initializing database:', err);
    process.exit(1);
  }
}).catch(err => {
  logger.error('Unable to connect to database:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err);
  // Close server & exit process
  process.exit(1);
});

export default app; 