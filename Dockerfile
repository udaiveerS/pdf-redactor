# Multi-stage build for React frontend and Node.js backend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files for production
COPY package*.json ./
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm ci --only=production

# Copy built React app from builder stage
COPY --from=builder /app/build ./build

# Copy server code
COPY server ./server

# Expose port
EXPOSE 8080

# Start the server
CMD ["npm", "start"] 