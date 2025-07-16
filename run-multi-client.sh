#!/bin/bash

# Multi-client simulation script for collaborative project management
# Usage: ./run-multi-client.sh [number_of_clients] [start_port]

# Default values
NUM_CLIENTS=${1:-3}
START_PORT=${2:-8081}

echo "🚀 Starting multi-client collaborative environment with $NUM_CLIENTS clients starting from port $START_PORT"

# Function to display client URLs
show_urls() {
    local num_clients=$1
    local start_port=$2
    
    echo ""
    echo "📋 Environment URLs:"
    echo "Backend API: http://localhost:8080"
    for i in $(seq 1 $num_clients); do
        local port=$((start_port + i - 1))
        echo "Client $i: http://localhost:$port"
    done
    echo ""
    echo "💡 Testing Instructions:"
    echo "1. Open each client URL in a separate browser tab"
    echo "2. Create projects and tasks in any client"
    echo "3. Watch real-time synchronization across all clients"
    echo "4. Test collaborative editing by making changes in different clients"
    echo ""
}

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    docker compose -f docker-compose.multi-client.yml down
}

# Function to create dynamic docker-compose file
create_compose_file() {
    local num_clients=$1
    local start_port=$2
    
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

    # Add client services dynamically
    for i in $(seq 1 $num_clients); do
        local port=$((start_port + i - 1))
        cat >> docker-compose.multi-client.yml << EOF
  # Client $i - React app
  project-colab-client-$i:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "$port:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
      - REACT_APP_CLIENT_ID=client-$i
    restart: unless-stopped
    networks:
      - project-colab-network
    depends_on:
      - project-colab-backend

EOF
    done

    cat >> docker-compose.multi-client.yml << EOF
networks:
  project-colab-network:
    driver: bridge
EOF
}

# Trap to cleanup on exit
trap cleanup EXIT

# Create dynamic compose file
create_compose_file $NUM_CLIENTS $START_PORT

# Show URLs
show_urls $NUM_CLIENTS $START_PORT

# Start services
echo "🔧 Starting services..."
docker compose -f docker-compose.multi-client.yml up --build

echo "✅ Multi-client simulation complete!" 