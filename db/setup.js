const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  console.log('Setting up PostgreSQL database...');

  try {
    // Default connection string for local development
    const connectionString = 'postgres://postgres:P@ssw0rd@localhost:5432/postgres';
    console.log('Using connection string:', connectionString);

    // Create a postgres connection
    const sql = postgres(connectionString, {
      max: 1
    });

    // Create database if not exists
    try {
      console.log('Creating postgres database if not exists...');
      // postgres veritabanı zaten var olduğu için bu adımı atlıyoruz
      // await sql.unsafe('CREATE DATABASE postgres;');
      console.log('Database already exists, continuing...');
    } catch (err) {
      if (err.code === '42P04') {
        console.log('Database already exists, continuing...');
      } else {
        throw err;
      }
    }

    // Connect to the postgres database
    await sql.end();
    const dbSql = postgres('postgres://postgres:P@ssw0rd@localhost:5432/postgres', {
      max: 1
    });

    // Read SQL file
    const sqlFile = path.join(__dirname, 'migrations', '0000_auth_schema.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Run SQL queries
    console.log('Running SQL migrations...');
    await dbSql.unsafe(sqlContent);
    console.log('Database schema created successfully');

    // Disconnect
    await dbSql.end();

    console.log('Database setup completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  }
}

main();