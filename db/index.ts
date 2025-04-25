import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/auth";
import * as dotenv from 'dotenv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: './.env' });

// Database connection configuration
const getConnectionString = () => {
  const connectionString = 'postgres://postgres:P@ssw0rd@localhost:5432/kentkonutdb';
  return connectionString;
};

// Connection configuration with retry logic
const pgOptions = {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
  max_lifetime: 60 * 30, // Connection max lifetime in seconds (30 minutes)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  onnotice: (notice: any) => {
    console.log('Database notice:', notice);
  },
  debug: process.env.NODE_ENV === 'development',
};

// Create postgres connection with error handling
let client;
try {
  client = postgres(getConnectionString(), pgOptions);
  console.log('Database connection initialized successfully');
} catch (error) {
  console.error('Error initializing database connection:', error);
  // Use a fallback connection string or throw
  if (process.env.NODE_ENV === 'development') {
    console.warn('Using fallback database settings in development mode');
    client = postgres('postgres://postgres:P@ssw0rd@localhost:5432/postgres', pgOptions);
  } else {
    throw new Error('Failed to connect to database. Please check your connection settings.');
  }
}

// Create Drizzle ORM instance
export const db = drizzle(client, { schema });

// Export schema
export { schema };

// Initialize database with migrations and error handling
export const initializeDatabase = async (retries = 3) => {
  console.log('Initializing database...');
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await migrate(db, { migrationsFolder: './db/migrations' });
      console.log('Database initialized successfully');
      return true;
    } catch (error) {
      console.error(`Error initializing database (attempt ${attempt}/${retries}):`, error);
      
      if (attempt < retries) {
        const delay = attempt * 2000; // Exponential backoff
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('Database initialization failed after multiple attempts');
        return false;
      }
    }
  }
  return false;
};

// Check database connection health
export const checkDatabaseConnection = async () => {
  try {
    // Try a simple query to check connection
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}; 