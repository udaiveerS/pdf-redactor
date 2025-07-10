#!/bin/bash

echo "Starting Docker development environment..."
echo "Frontend will be available at http://localhost:3000"
echo "Backend will be available at http://localhost:8080"
echo ""

# Build and start the development container
docker compose -f docker-compose.dev.yml up --build

echo ""
echo "Development environment started!"
echo "You can now test the API using the ApiTest component in the frontend." 