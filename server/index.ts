/**
 * Main Server Entry Point - Collaborative Project Management API
 * 
 * This file sets up the Express HTTP server and integrates the WebSocket service
 * for real-time collaborative project management functionality.
 * 
 * Features:
 * - Express HTTP server with REST API endpoints
 * - WebSocket service integration for real-time collaboration
 * - Static file serving for the React frontend
 * - Health check and client information endpoints
 * - Comprehensive error handling and logging
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer, Server } from 'http';
import { WebSocketService } from './WebSocketService.js';

// ===== SERVER CONFIGURATION =====

// Create Express application instance
const app = express();

// Create HTTP server and attach Express app
const server = createServer(app);

// Server port configuration (default: 8080)
const PORT: number = parseInt(process.env.PORT || '8080', 10);

// ===== WEBSOCKET SERVICE INITIALIZATION =====

// Initialize WebSocket service for real-time collaboration
// This service handles client connections, event broadcasting, and synchronization
try {
    new WebSocketService(server);
    console.log('✓ WebSocket service initialized successfully');
} catch (error) {
    console.error('❌ Error initializing WebSocket service:', error);
}

// ===== EXPRESS MIDDLEWARE SETUP =====

// Parse JSON request bodies
app.use(express.json());

// Conditional static file serving based on container type
const isBackendOnly = process.env.BACKEND_ONLY === 'true';

if (isBackendOnly) {
    // Backend-only server - no static file serving
    console.log('📁 Backend-only server - no static files');
} else {
    // Frontend container - serve React app
    const buildPath = path.join(process.cwd(), 'build');
    console.log('📁 Serving static files from:', buildPath);
    app.use(express.static(buildPath));
}

// ===== API ENDPOINTS =====

/**
 * Health Check Endpoint
 * 
 * Returns server status and configuration information.
 * Used by monitoring tools and client applications to verify server health.
 * 
 * GET /api/health
 * Response: Server status, timestamp, WebSocket status, and port information
 */
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        websocket: 'enabled',
        port: PORT
    });
});

// ===== CONDITIONAL ROUTING =====

if (isBackendOnly) {
    /**
     * Catch-all route for backend-only server
     * 
     * Returns 404 for any non-API routes since this is backend-only.
     * Frontend is served by separate client containers.
     * 
     * GET /*
     * Response: 404 Not Found
     */
    app.get('*', (req: Request, res: Response) => {
        res.status(404).json({
            error: 'Not Found',
            message: 'This is a backend-only server. Frontend is served by client containers.',
            availableEndpoints: ['/api/health']
        });
    });
} else {
    /**
     * Catch-all route for React Router
     * 
     * Serves the React app's index.html for any route that doesn't match an API endpoint.
     * This enables client-side routing to work properly.
     * 
     * GET /*
     * Response: React app's index.html file
     */
    app.get('*', (req: Request, res: Response) => {
        const indexPath = path.join(process.cwd(), 'build', 'index.html');
        console.log('📄 Serving index.html from:', indexPath);
        res.sendFile(indexPath);
    });
}

// ===== SERVER STARTUP =====

// Start the HTTP server and listen for connections
server.listen(PORT, () => {
    console.log(`✓ Full-featured TypeScript ESM server running on http://localhost:${PORT}`);
    console.log(`✓ WebSocket server available at ws://localhost:${PORT}`);
    console.log(`✓ Health check available at http://localhost:${PORT}/api/health`);
});

// Export the Express app for testing purposes
export default app; 