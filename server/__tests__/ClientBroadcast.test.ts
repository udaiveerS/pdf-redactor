import { WebSocketService } from '../WebSocketService.js';
import { createServer } from 'http';
import { WebSocket } from 'ws';
import type { EventNode, ProjectNode } from '../../shared/types';

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

// Helper function to create test project data
function createTestProject(id: string, name: string): ProjectNode {
    return {
        id,
        name,
        description: `Description for ${name}`,
        tasks: [],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
    };
}

describe('ClientBroadcast', () => {
    let server: any;
    let webSocketService: WebSocketService;

    beforeEach(() => {
        server = createServer();
        webSocketService = new WebSocketService(server, { initialEvents: [], initialLamportCounter: 0 });
    });

    afterEach(() => {
        server.close();
    });

    it('should send event to all connected clients', () => {
        // Setup
        const mockWs1 = new MockWebSocket();
        const mockWs2 = new MockWebSocket();
        webSocketService.addClient(mockWs1);
        webSocketService.addClient(mockWs2);

        const testEvent: EventNode = {
            id: 'broadcast-event',
            lamportTs: 1,
            timestamp: '2023-01-01T00:00:00.000Z',
            action: 'create',
            nodeType: 'project',
            nodeId: 'project-1',
            data: createTestProject('project-1', 'Broadcast Project')
        };

        // Execute
        webSocketService.broadcastEvent(testEvent);

        // Verify
        expect(mockWs1.sentMessages).toHaveLength(1);
        expect(mockWs2.sentMessages).toHaveLength(1);

        const sentEvent1 = JSON.parse(mockWs1.sentMessages[0]);
        const sentEvent2 = JSON.parse(mockWs2.sentMessages[0]);
        expect(sentEvent1.id).toBe('broadcast-event');
        expect(sentEvent2.id).toBe('broadcast-event');
    });

    it('should not send to closed clients', () => {
        // Setup
        const mockWs1 = new MockWebSocket();
        const mockWs2 = new MockWebSocket();
        webSocketService.addClient(mockWs1);
        webSocketService.addClient(mockWs2);

        // Close one client
        mockWs2.close();

        const testEvent: EventNode = {
            id: 'broadcast-event',
            lamportTs: 1,
            timestamp: '2023-01-01T00:00:00.000Z',
            action: 'create',
            nodeType: 'project',
            nodeId: 'project-1',
            data: createTestProject('project-1', 'Broadcast Project')
        };

        // Execute
        webSocketService.broadcastEvent(testEvent);

        // Verify
        expect(mockWs1.sentMessages).toHaveLength(1);
        expect(mockWs2.sentMessages).toHaveLength(0);
    });

    it('should handle empty clients list', () => {
        // Setup
        const testEvent: EventNode = {
            id: 'broadcast-event',
            lamportTs: 1,
            timestamp: '2023-01-01T00:00:00.000Z',
            action: 'create',
            nodeType: 'project',
            nodeId: 'project-1',
            data: createTestProject('project-1', 'Broadcast Project')
        };

        // Execute - should not throw
        expect(() => {
            webSocketService.broadcastEvent(testEvent);
        }).not.toThrow();
    });
}); 