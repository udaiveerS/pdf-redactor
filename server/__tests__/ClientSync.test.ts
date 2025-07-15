import { WebSocketService } from '../WebSocketService.js';
import { createServer } from 'http';
import { WebSocket } from 'ws';
import type { EventNode, HandshakeMessage, ProjectNode } from '../../shared/types';

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

describe('ClientSync', () => {
    let server: any;
    let webSocketService: WebSocketService;
    let mockWs: MockWebSocket;

    beforeEach(() => {
        server = createServer();
        webSocketService = new WebSocketService(server, { initialEvents: [], initialLamportCounter: 0 });
        mockWs = new MockWebSocket();
    });

    afterEach(() => {
        server.close();
    });

    it('should send events since client last known timestamp', () => {
        // Setup test data
        const testEvents: EventNode[] = [
            {
                id: 'event-1',
                lamportTs: 1,
                timestamp: '2023-01-01T00:00:00.000Z',
                action: 'create',
                nodeType: 'project',
                nodeId: 'project-1',
                data: createTestProject('project-1', 'Test Project')
            },
            {
                id: 'event-2',
                lamportTs: 3,
                timestamp: '2023-01-01T00:00:01.000Z',
                action: 'update',
                nodeType: 'project',
                nodeId: 'project-1',
                data: createTestProject('project-1', 'Updated Project')
            }
        ];

        webSocketService.setEvents(testEvents);
        webSocketService.addClient(mockWs);

        const handshakeData: HandshakeMessage = {
            type: 'handshake',
            clientId: 'test-client',
            lastKnownLamportTs: 1
        };

        // Execute
        webSocketService.handleClientSync(handshakeData, mockWs);

        // Verify
        expect(mockWs.sentMessages).toHaveLength(2);
        const sentEvent1 = JSON.parse(mockWs.sentMessages[0]);
        const sentEvent2 = JSON.parse(mockWs.sentMessages[1]);
        expect(sentEvent1.id).toBe('event-1');
        expect(sentEvent2.id).toBe('event-2');
    });

    it('should not send events when client is up to date', () => {
        // Setup test data
        const testEvents: EventNode[] = [
            {
                id: 'event-1',
                lamportTs: 1,
                timestamp: '2023-01-01T00:00:00.000Z',
                action: 'create',
                nodeType: 'project',
                nodeId: 'project-1',
                data: createTestProject('project-1', 'Test Project')
            }
        ];

        webSocketService.setEvents(testEvents);
        webSocketService.addClient(mockWs);

        const handshakeData: HandshakeMessage = {
            type: 'handshake',
            clientId: 'test-client',
            lastKnownLamportTs: 2
        };

        // Execute
        webSocketService.handleClientSync(handshakeData, mockWs);

        // Verify
        expect(mockWs.sentMessages).toHaveLength(0);
    });

    it('should handle client with no previous events', () => {
        // Setup test data
        const testEvents: EventNode[] = [
            {
                id: 'event-1',
                lamportTs: 1,
                timestamp: '2023-01-01T00:00:00.000Z',
                action: 'create',
                nodeType: 'project',
                nodeId: 'project-1',
                data: createTestProject('project-1', 'Test Project')
            }
        ];

        webSocketService.setEvents(testEvents);
        webSocketService.addClient(mockWs);

        const handshakeData: HandshakeMessage = {
            type: 'handshake',
            clientId: 'test-client',
            lastKnownLamportTs: 0
        };

        // Execute
        webSocketService.handleClientSync(handshakeData, mockWs);

        // Verify
        expect(mockWs.sentMessages).toHaveLength(1);
        const sentEvent = JSON.parse(mockWs.sentMessages[0]);
        expect(sentEvent.id).toBe('event-1');
    });
}); 