#!/bin/bash

echo "Restarting Docker development environment..."
echo "This will ensure the proxy changes take effect."

# Stop any running containers
docker compose -f docker-compose.dev.yml down

# Remove any cached containers
docker compose -f docker-compose.dev.yml rm -f

# Start fresh
docker compose -f docker-compose.dev.yml up --build

echo ""
echo "Development environment restarted!"
echo "Check the console logs for proxy setup messages." 