import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer, Server } from 'http';
import { WebSocketService } from './WebSocketService.js';

// --- Express/HTTP Server Setup ---
const app = express();
const server = createServer(app);
const PORT: number = parseInt(process.env.PORT || '8080', 10);

let webSocketService: WebSocketService;
try {
    webSocketService = new WebSocketService(server);
} catch (error) {
    console.error('❌ Error initializing WebSocket service:', error);
}

app.use(express.json());
app.use(express.static(path.join(fileURLToPath(import.meta.url), '../public')));

app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        websocket: 'enabled',
        port: PORT
    });
});

app.get('/api/client-info', (req: Request, res: Response) => {
    res.json({
        clientId: `client-${Date.now()}`,
        timestamp: new Date().toISOString(),
        websocketUrl: `ws://${req.get('host')}`
    });
});

server.listen(PORT, () => {
    console.log(`✓ Full-featured TypeScript ESM server running on http://localhost:${PORT}`);
});

export default app; 