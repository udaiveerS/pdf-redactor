import { WebSocketService } from '../WebSocketService.js';
import { createServer } from 'http';
import { WebSocket } from 'ws';

// Mock WebSocket for testing
class MockWebSocket {
    public sentMessages: string[] = [];
    public readyState: 0 | 1 | 2 | 3 = WebSocket.OPEN;

    send(data: string): void {
        this.sentMessages.push(data);
    }

    close(): void {
        this.readyState = WebSocket.CLOSED;
    }
}

describe('ClientManagement', () => {
    let server: any;
    let webSocketService: WebSocketService;

    beforeEach(() => {
        server = createServer();
        webSocketService = new WebSocketService(server, { initialEvents: [], initialLamportCounter: 0 });
    });

    afterEach(() => {
        server.close();
    });

    it('should track connected clients correctly', () => {
        // Setup
        const mockWs1 = new MockWebSocket();
        const mockWs2 = new MockWebSocket();

        // Execute
        webSocketService.addClient(mockWs1);
        expect(webSocketService.getClientsCount()).toBe(1);

        webSocketService.addClient(mockWs2);
        expect(webSocketService.getClientsCount()).toBe(2);

        webSocketService.removeClient(mockWs1);
        expect(webSocketService.getClientsCount()).toBe(1);
    });

    it('should handle duplicate client additions', () => {
        // Setup
        const mockWs = new MockWebSocket();

        // Execute
        webSocketService.addClient(mockWs);
        webSocketService.addClient(mockWs);

        // Verify
        expect(webSocketService.getClientsCount()).toBe(1);
    });
}); 