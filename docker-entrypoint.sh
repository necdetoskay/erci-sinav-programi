#!/bin/sh

# Wait for the database to be ready (optional, but recommended)
# You might need to adjust the host and port based on your docker-compose setup
# wait-for-it.sh erci_sinav_db:5432 --timeout=30 --strict -- echo "Database is up"

# Run Prisma migrations
echo "Running Prisma migrations..."
pnpm prisma migrate deploy
echo "Prisma migrations finished."

# Execute the main command
pnpm start
