#!/bin/sh
set -e

echo "========================================="
echo "  Nova Stack - Starting up..."
echo "========================================="

# Ensure data directory exists
mkdir -p /app/data

# Generate Prisma Client
echo "[1/3] Generating Prisma Client..."
npx prisma generate
echo "       Prisma Client ready."

# Run migrations
echo "[2/3] Applying database migrations..."
npx prisma migrate deploy
echo "       Database ready."

# Seed database in development mode
if [ "$NODE_ENV" = "development" ]; then
  echo "[3/3] Seeding database..."
  npm run seed
  echo "       Seeding complete."
else
  echo "[3/3] Skipping seed (production mode)."
fi

echo "========================================="
echo "  App running at http://localhost:3000"
echo "========================================="

# Start the application
exec npm start
