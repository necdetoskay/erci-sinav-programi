// This is a JavaScript file to avoid TypeScript errors
require('dotenv').config();

/** @type {import('drizzle-kit').Config} */
module.exports = {
  schema: "./db/schema/auth.ts",
  out: "./db/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/kentkonutdb",
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  verbose: process.env.NODE_ENV === 'development', // Show verbose output in development
  strict: true, // Prevent potential data loss operations
}; 