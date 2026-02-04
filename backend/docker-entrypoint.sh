#!/bin/bash
set -e

echo "=== Starting CompetManager Backend ==="
echo "PORT: ${PORT:-8080}"

# Clear caches
echo "Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Run migrations
echo "Running migrations..."
php artisan migrate --force || echo "Migration failed or already up to date"

# Start server
echo "Starting server on port ${PORT:-8080}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
