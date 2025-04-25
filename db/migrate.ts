import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index";
import 'dotenv/config';

// This script will automatically run the migrations
async function main() {
  console.log("Running migrations...");
  
  try {
    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.log("Migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

main(); 