#!/bin/bash

# Multi-client simulation script for sales dashboard
# Usage: ./run-multi-client.sh [number_of_clients] [start_port]

# Default values
NUM_CLIENTS=${1:-3}
START_PORT=${2:-8081}

echo "🚀 Starting multi-client simulation with $NUM_CLIENTS clients starting from port $START_PORT"

# Function to create dynamic docker-compose override
create_override() {
    local num_clients=$1
    local start_port=$2
    
    cat > docker-compose.override.yml << EOF
version: '3.8'

services:
EOF

    for i in $(seq 1 $num_clients); do
        local port=$((start_port + i - 1))
        cat >> docker-compose.override.yml << EOF
  project-colab-client-$i:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "$port:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
      - CLIENT_ID=client-$i
    restart: unless-stopped
    networks:
      - project-colab-network

EOF
    done

    cat >> docker-compose.override.yml << EOF
networks:
  project-colab-network:
    driver: bridge
EOF
}

# Function to display client URLs
show_urls() {
    local num_clients=$1
    local start_port=$2
    
    echo ""
    echo "📋 Client URLs:"
    echo "Backend: http://localhost:8080"
    for i in $(seq 1 $num_clients); do
        local port=$((start_port + i - 1))
        echo "Client $i: http://localhost:$port"
    done
    echo ""
}

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    docker compose -f docker-compose.yml -f docker-compose.override.yml down
    rm -f docker-compose.override.yml
}

# Trap to cleanup on exit
trap cleanup EXIT

# Create dynamic override file
create_override $NUM_CLIENTS $START_PORT

# Show URLs
show_urls $NUM_CLIENTS $START_PORT

# Start services
echo "🔧 Starting services..."
docker compose -f docker-compose.yml -f docker-compose.override.yml up --build

echo "✅ Multi-client simulation complete!" 