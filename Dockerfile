# Production Dockerfile - Based on working dev approach
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Expose port
EXPOSE 8080

# Set Node.js memory limit for TypeScript compilation
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_ENV=production

# Start the server using the same approach as dev but for production
CMD ["npm", "start"] 