# Multi-Client Docker Setup

This setup allows you to run multiple instances of your sales dashboard application to simulate a multi-client environment.

## 🚀 Quick Start

### Option 1: Using the Script (Recommended)
```bash
# Run 3 clients starting from port 8081
./run-multi-client.sh 3 8081

# Run 5 clients starting from port 8081
./run-multi-client.sh 5 8081

# Run 10 clients starting from port 8090
./run-multi-client.sh 10 8090
```

### Option 2: Using Docker Compose Directly
```bash
# Run with predefined 5 clients
docker compose -f docker-compose.multi-client.yml up --build

# Run with specific client profiles
docker compose -f docker-compose.scalable.yml --profile client-1 --profile client-2 up --build
```

## 📋 Available URLs

After starting the services, you can access:

- **Backend**: http://localhost:8080
- **Client 1**: http://localhost:8081
- **Client 2**: http://localhost:8082
- **Client 3**: http://localhost:8083
- **Client 4**: http://localhost:8084
- **Client 5**: http://localhost:8085

## 🔧 Configuration Options

### Environment Variables

Each client can be configured with environment variables:

```yaml
environment:
  - NODE_ENV=production
  - PORT=8080
  - CLIENT_ID=client-1
  - REACT_APP_CLIENT_ID=client-1
  - REACT_APP_PORT=8081
```

### Client Identification

Each client instance displays a unique identifier in the top-right corner showing:
- Client ID (e.g., "client-1", "client-2")
- Port number

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client 1      │    │   Client 2      │    │   Client 3      │
│   Port: 8081    │    │   Port: 8082    │    │   Port: 8083    │
│   ID: client-1  │    │   ID: client-2  │    │   ID: client-3  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Backend       │
                    │   Port: 8080    │
                    │   (Shared)      │
                    └─────────────────┘
```

## 🛠️ Development Mode

For development with hot reloading:

```bash
# Development with multiple clients
docker-compose -f docker-compose.dev.yml up --build

# Or create a custom development setup
docker-compose -f docker-compose.yml -f docker-compose.dev.override.yml up --build
```

## 📊 Monitoring

### View Running Containers
```bash
docker ps
```

### View Logs
```bash
# All services
docker compose -f docker-compose.multi-client.yml logs

# Specific client
docker compose -f docker-compose.multi-client.yml logs project-colab-client-1

# Follow logs
docker compose -f docker-compose.multi-client.yml logs -f
```

### Resource Usage
```bash
docker stats
```

## 🧹 Cleanup

```bash
# Stop all services
docker compose -f docker-compose.multi-client.yml down

# Remove all containers and images
docker compose -f docker-compose.multi-client.yml down --rmi all --volumes

# Using the script (automatic cleanup)
./run-multi-client.sh
```

## 🔄 Scaling

### Manual Scaling
```bash
# Scale to 10 clients
docker compose -f docker-compose.multi-client.yml up --scale project-colab-client=10
```

### Dynamic Scaling with Script
```bash
# Create custom number of clients
./run-multi-client.sh 15 8090
```

## 🎯 Use Cases

1. **Load Testing**: Simulate multiple users accessing the application
2. **Multi-tenant Testing**: Test different client configurations
3. **Performance Testing**: Measure system performance under load
4. **UI Testing**: Test responsive design across multiple instances
5. **Integration Testing**: Test client-server communication patterns

## 🚨 Troubleshooting

### Port Conflicts
If you get port conflicts, change the start port:
```bash
./run-multi-client.sh 3 8090  # Start from port 8090
```

### Memory Issues
For many clients, increase Docker memory:
```bash
# In Docker Desktop settings
# Memory: 4GB or higher
# CPUs: 2 or higher
```

### Network Issues
```bash
# Reset Docker network
docker network prune

# Recreate networks
docker compose -f docker-compose.multi-client.yml down
docker compose -f docker-compose.multi-client.yml up --build
```

## 📝 Notes

- Each client runs in its own container
- All clients share the same backend service
- Client identification is visible in the UI
- Environment variables can be customized per client
- The setup supports both development and production modes 