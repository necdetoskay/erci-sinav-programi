import { Sequelize } from 'sequelize';
import logger from '../utils/logger.js';

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'kentwebadmin',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    schema: process.env.DB_SCHEMA || 'public',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true, // Enable timestamps for all models
      underscored: true, // Use snake_case for all column names
      freezeTableName: true // Don't pluralize table names
    }
  }
);

// Test database connection
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection has been established successfully.');
    
    // Sync models with database in development environment
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Database synced successfully.');
    }
    
    return sequelize;
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    logger.warn('⚠️ Application continuing without database connection...');
    // throw error; // Hatayı fırlatmıyoruz, uygulama veritabanı olmadan da başlayacak
    return null;
  }
};

export default sequelize; 