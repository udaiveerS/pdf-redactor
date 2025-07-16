import { WebSocketService } from '../WebSocketService.js';
import { createServer } from 'http';
import { WebSocket } from 'ws';
// Mock WebSocket for testing
class MockWebSocket {
    constructor() {
        this.sentMessages = [];
        this.readyState = WebSocket.OPEN;
    }
    send(data) {
        this.sentMessages.push(data);
    }
    close() {
        this.readyState = WebSocket.CLOSED;
    }
}
describe('ClientManagement', () => {
    let server;
    let webSocketService;
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
//# sourceMappingURL=ClientManagement.test.js.map