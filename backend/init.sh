#!/bin/sh
set -e

echo "🔄 Starting initialization..."

# Ensure SSL mode for managed providers like Railway
export PGSSLMODE=${PGSSLMODE:-require}

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL..."
if [ -n "$DATABASE_URL" ]; then
  # Prefer single connection string when available
  until psql "$DATABASE_URL" -c '\q' 2>/dev/null; do
    echo "⏳ PostgreSQL is unavailable (via DATABASE_URL) - sleeping"
    sleep 2
  done
else
  until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "postgres" -c '\q' 2>/dev/null; do
    echo "⏳ PostgreSQL is unavailable - sleeping"
    sleep 2
  done
fi

echo "✅ PostgreSQL is up"

# Create database if using discrete envs; skip for managed providers
if [ -z "$DATABASE_URL" ]; then
  echo "🔄 Creating database if needed..."
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
  echo "✅ Database is ready"
fi

# Run migrations
echo "🔄 Running database migrations..."
node scripts/migrate.js

# Run seeds
echo "🌱 Seeding database..."
node scripts/seed.js

echo "✅ Initialization complete!"

# Start the application
echo "🚀 Starting server..."
exec node src/server.js
