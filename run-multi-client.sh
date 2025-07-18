#!/bin/bash

# Multi-Client Docker Setup Script
# Usage: ./run-multi-client.sh [num_clients] [start_port]

set -e

# Default values
NUM_CLIENTS=${1:-3}
START_PORT=${2:-8081}

# Validate inputs
if ! [[ "$NUM_CLIENTS" =~ ^[0-9]+$ ]] || [ "$NUM_CLIENTS" -lt 1 ] || [ "$NUM_CLIENTS" -gt 20 ]; then
    echo "Error: Number of clients must be between 1 and 20"
    echo "Usage: $0 [num_clients] [start_port]"
    exit 1
fi

if ! [[ "$START_PORT" =~ ^[0-9]+$ ]] || [ "$START_PORT" -lt 1024 ] || [ "$START_PORT" -gt 65535 ]; then
    echo "Error: Start port must be between 1024 and 65535"
    echo "Usage: $0 [num_clients] [start_port]"
    exit 1
fi

# Check for port conflicts
for ((i=0; i<NUM_CLIENTS; i++)); do
    PORT=$((START_PORT + i))
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Error: Port $PORT is already in use"
        exit 1
    fi
done

echo "🚀 Setting up $NUM_CLIENTS clients starting from port $START_PORT..."

# Generate docker-compose file
cat > docker-compose.multi-client.yml << EOF
services:
  # Backend service - API and WebSocket only
  project-colab-backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
    restart: unless-stopped
    networks:
      - project-colab-network

EOF

# Generate client services
for ((i=1; i<=NUM_CLIENTS; i++)); do
    PORT=$((START_PORT + i - 1))
    cat >> docker-compose.multi-client.yml << EOF
  # Client $i - React app
  project-colab-client-$i:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "$PORT:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
    restart: unless-stopped
    networks:
      - project-colab-network
    depends_on:
      - project-colab-backend

EOF
done

# Add networks section
cat >> docker-compose.multi-client.yml << EOF
networks:
  project-colab-network:
    driver: bridge
EOF

echo "✅ Generated docker-compose.multi-client.yml with $NUM_CLIENTS clients"
echo ""
echo "📋 Available URLs:"
echo "  Backend: http://localhost:8080"
for ((i=1; i<=NUM_CLIENTS; i++)); do
    PORT=$((START_PORT + i - 1))
    echo "  Client $i: http://localhost:$PORT"
done
echo ""
echo "🚀 Starting services..."
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    docker compose -f docker-compose.multi-client.yml down
    echo "✅ Cleanup complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the services
docker compose -f docker-compose.multi-client.yml up --build

# If we get here, cleanup
cleanup