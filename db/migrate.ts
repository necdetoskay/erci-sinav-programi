// This file is deprecated. Use Prisma migrations instead.
import { prisma } from "@/lib/prisma";
import 'dotenv/config';

// This script will automatically run the migrations
async function main() {
  console.log("Running migrations with Prisma...");

  try {
    // Use Prisma's $executeRaw to run a simple query to test the connection
    await prisma.$executeRaw`SELECT 1`;
    console.log("Database connection test successful");

    console.log("To run Prisma migrations, use: npx prisma migrate dev");
    process.exit(0);
  } catch (error) {
    console.error("Error during database connection test:", error);
    process.exit(1);
  }
}

main();