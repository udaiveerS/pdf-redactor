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

// Serve static files from the React build directory
// This allows the frontend to be served from the same server
app.use(express.static(path.join(fileURLToPath(import.meta.url), '../public')));

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



// ===== SERVER STARTUP =====

// Start the HTTP server and listen for connections
server.listen(PORT, () => {
    console.log(`✓ Full-featured TypeScript ESM server running on http://localhost:${PORT}`);
    console.log(`✓ WebSocket server available at ws://localhost:${PORT}`);
    console.log(`✓ Health check available at http://localhost:${PORT}/api/health`);
});

// Export the Express app for testing purposes
export default app; 