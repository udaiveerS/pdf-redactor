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
// Helper function to create test task data
function createTestTask(id, projectId, title) {
    return {
        id,
        projectId,
        title,
        status: 'pending',
        configuration: {
            priority: 1,
            description: `Description for ${title}`
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
    };
}
describe('SingleEvent', () => {
    let server;
    let webSocketService;
    let mockWs;
    beforeEach(() => {
        server = createServer();
        webSocketService = new WebSocketService(server, { initialEvents: [], initialLamportCounter: 0 });
        mockWs = new MockWebSocket();
    });
    afterEach(() => {
        server.close();
    });
    it('should add valid event to events array and broadcast it', () => {
        // Setup
        webSocketService.addClient(mockWs);
        const initialEventCount = webSocketService.getEvents().length;
        const testEvent = {
            id: 'new-event',
            lamportTs: 5,
            timestamp: '2023-01-01T00:00:02.000Z',
            action: 'create',
            nodeType: 'task',
            nodeId: 'task-1',
            data: createTestTask('task-1', 'project-1', 'New Task')
        };
        // Execute
        webSocketService.handleSingleEvent(testEvent);
        // Verify
        const events = webSocketService.getEvents();
        expect(events).toHaveLength(initialEventCount + 1);
        expect(events[events.length - 1].id).toBe('new-event');
        expect(mockWs.sentMessages).toHaveLength(1);
        const broadcastedEvent = JSON.parse(mockWs.sentMessages[0]);
        expect(broadcastedEvent.id).toBe('new-event');
    });
    it('should update lamport counter when event timestamp is higher', () => {
        // Setup
        webSocketService.setLamportCounter(3);
        const testEvent = {
            id: 'new-event',
            lamportTs: 5,
            timestamp: '2023-01-01T00:00:02.000Z',
            action: 'create',
            nodeType: 'task',
            nodeId: 'task-1',
            data: createTestTask('task-1', 'project-1', 'New Task')
        };
        // Execute
        webSocketService.handleSingleEvent(testEvent);
        // Verify
        expect(webSocketService.getCurrentLamportCounter()).toBe(6);
    });
    it('should not update lamport counter when event timestamp is lower', () => {
        // Setup
        webSocketService.setLamportCounter(10);
        const testEvent = {
            id: 'new-event',
            lamportTs: 5,
            timestamp: '2023-01-01T00:00:02.000Z',
            action: 'create',
            nodeType: 'task',
            nodeId: 'task-1',
            data: createTestTask('task-1', 'project-1', 'New Task')
        };
        // Execute
        webSocketService.handleSingleEvent(testEvent);
        // Verify
        expect(webSocketService.getCurrentLamportCounter()).toBe(10);
    });
    it('should handle event with missing id', () => {
        // Setup
        const invalidEvent = {
            lamportTs: 5,
            timestamp: '2023-01-01T00:00:02.000Z',
            action: 'create',
            nodeType: 'task',
            nodeId: 'task-1',
            data: createTestTask('task-1', 'project-1', 'New Task')
        };
        const initialEventCount = webSocketService.getEvents().length;
        // Execute
        webSocketService.handleSingleEvent(invalidEvent);
        // Verify
        expect(webSocketService.getEvents()).toHaveLength(initialEventCount);
    });
    it('should add default values for missing timestamp and lamportTs', () => {
        // Setup
        webSocketService.addClient(mockWs);
        const testEvent = {
            id: 'new-event',
            action: 'create',
            nodeType: 'task',
            nodeId: 'task-1',
            data: createTestTask('task-1', 'project-1', 'New Task')
        };
        // Execute
        webSocketService.handleSingleEvent(testEvent);
        // Verify
        const events = webSocketService.getEvents();
        const addedEvent = events[events.length - 1];
        expect(addedEvent.lamportTs).toBe(0);
        expect(addedEvent.timestamp).toBeDefined();
        expect(new Date(addedEvent.timestamp).getTime()).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=SingleEvent.test.js.map