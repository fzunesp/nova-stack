#!/bin/sh
set -e

echo "========================================="
echo "  Nova Stack - Starting up..."
echo "========================================="

# Wait for PostgreSQL to be ready
echo "[0/3] Waiting for PostgreSQL..."
until echo "SELECT 1" | npx prisma db execute --stdin 2>/dev/null; do
  echo "       Waiting for database..."
  sleep 2
done
echo "       PostgreSQL ready."

# Generate Prisma Client
echo "[1/3] Generating Prisma Client..."
npx prisma generate
echo "       Prisma Client ready."

# Run migrations
echo "[2/3] Applying database migrations..."
npx prisma migrate deploy
echo "       Migrations applied."

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
