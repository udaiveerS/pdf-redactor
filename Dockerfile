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

# Accept build arguments for client-specific environment variables
ARG REACT_APP_CLIENT_ID=client-1
ARG REACT_APP_PORT=8081

# Set environment variables for the build process
ENV REACT_APP_CLIENT_ID=$REACT_APP_CLIENT_ID
ENV REACT_APP_PORT=$REACT_APP_PORT

# Build the React app with client-specific environment variables
RUN npm run build

# Expose port
EXPOSE 8080

# Set Node.js memory limit for TypeScript compilation
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_ENV=production

# Start the server using the same approach as dev but for production
CMD ["npm", "start"] 