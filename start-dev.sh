#!/bin/bash

echo "Starting development servers..."
echo "Frontend will run on http://localhost:3000"
echo "Backend will run on http://localhost:8080"
echo ""

# Start the backend server in the background
echo "Starting backend server..."
node --loader ts-node/esm server/index.ts &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start the frontend server
echo "Starting frontend server..."
npm start

# Cleanup: kill backend when frontend stops
trap "kill $BACKEND_PID" EXIT 