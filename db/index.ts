import { PrismaClient } from '@prisma/client';

// Declare a global variable to hold the Prisma Client instance
// This prevents creating multiple instances in development due to hot reloading
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Initialize Prisma Client
// Use the global instance if it exists, otherwise create a new one
const prisma = global.prisma || new PrismaClient({
  // Optional: Add logging configuration if needed
  // log: ['query', 'info', 'warn', 'error'],
});

// Assign the Prisma Client instance to the global variable in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export the Prisma Client instance
export const db = prisma;

// Optional: Add a function to check database connection (Prisma specific)
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    // $queryRaw is a good way to check the actual database connection
    await db.$queryRaw`SELECT 1`;
    // console.log('Database connection successful.'); // Removed log
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

// Note: Prisma migrations are typically handled via the Prisma CLI
// (e.g., `pnpm prisma migrate dev` or `pnpm prisma db push`),
// so the Drizzle-specific `initializeDatabase` function is removed.
// Ensure your database schema is synchronized using Prisma commands.
