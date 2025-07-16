/**
 * WebSocketService - Real-time Collaboration Server
 *
 * This service manages WebSocket connections for real-time collaborative project management.
 * It handles client synchronization, event broadcasting, and maintains a consistent
 * event log using Lamport timestamps for ordering.
 *
 * Key Features:
 * - Real-time bidirectional communication
 * - Client synchronization on connection
 * - Event broadcasting to all connected clients
 * - Lamport timestamp ordering for consistency
 * - Comprehensive error handling and logging
 */
import { WebSocketServer, WebSocket } from 'ws';
import { InitialStateManager } from './initialState.js';
/**
 * WebSocketService - Core real-time collaboration server
 *
 * Manages WebSocket connections and provides real-time synchronization
 * for collaborative project management features.
 */
export class WebSocketService {
    /**
     * Initialize WebSocket service with HTTP server
     * @param server - HTTP server to attach WebSocket to
     * @param options - Optional configuration for testing/initialization
     */
    constructor(server, options) {
        this.clients = new Set(); // Connected clients
        this.events = []; // Event log for synchronization
        this.lamportCounter = 0; // Lamport timestamp counter
        this.wss = new WebSocketServer({ server });
        this.initializeState(options);
        this.setupEventHandlers();
        // Log server startup information
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 'unknown';
        console.log(`✓ WebSocket server ready on ws://localhost:${port}`);
    }
    /**
     * Initialize the service state with events and Lamport counter
     * @param options - Optional initial state configuration
     */
    initializeState(options) {
        if (options?.initialEvents !== undefined && options?.initialLamportCounter !== undefined) {
            // Use provided initial state (typically for testing)
            this.events = [...options.initialEvents];
            this.lamportCounter = options.initialLamportCounter;
        }
        else {
            // Use default initial state from InitialStateManager
            const initialStateManager = new InitialStateManager();
            this.events = initialStateManager.createInitialEvents();
            this.lamportCounter = initialStateManager.getInitialLamportCounter();
        }
        // Log initial state for debugging
        console.log('📊 Initialized state:');
        console.log(`   - Events count: ${this.events.length}`);
        console.log(`   - Lamport counter: ${this.lamportCounter}`);
        this.events.forEach((event, index) => {
            console.log(`   - Event ${index + 1}: ${event.action} ${event.nodeType} ${event.nodeId}`);
        });
    }
    /**
     * Set up WebSocket event handlers for connection management
     */
    setupEventHandlers() {
        this.wss.on('connection', (ws) => {
            console.log('🔗 Client connected to WebSocket');
            this.clients.add(ws);
            // Handle incoming messages from client
            ws.on('message', (data) => {
                const message = data.toString();
                this.routeMessage(message, ws);
            });
            // Handle client disconnection
            ws.on('close', () => {
                console.log('🔌 Client disconnected from WebSocket');
                this.clients.delete(ws);
            });
            // Handle WebSocket errors
            ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
    }
    /**
     * Route incoming messages to appropriate handlers based on message type
     * @param message - Raw message string from client
     * @param ws - WebSocket connection that sent the message
     */
    routeMessage(message, ws) {
        console.log('📨 Raw message received from client:', message);
        try {
            const parsedMessage = JSON.parse(message);
            console.log('📨 Parsed message:', parsedMessage);
            // Determine message type and route accordingly
            const messageType = this.getMessageType(parsedMessage);
            console.log('🔄 Routing message as type:', messageType);
            switch (messageType) {
                case 'handshake':
                    console.log('🤝 Routing to handshake handler');
                    this.handleClientSync(parsedMessage, ws);
                    break;
                case 'event':
                    console.log('📝 Routing to event handler');
                    this.handleSingleEvent(parsedMessage);
                    break;
                default:
                    console.warn('⚠️ Unknown message type:', messageType);
            }
        }
        catch (error) {
            console.error('❌ Error processing message:', error);
        }
    }
    /**
     * Determine the type of incoming message for proper routing
     * @param message - Parsed message object
     * @returns Message type or 'unknown' if unrecognized
     */
    getMessageType(message) {
        console.log('🔍 Analyzing message type:', message);
        // Check for handshake messages using HandshakeMessage type
        if (this.isHandshakeMessage(message)) {
            console.log('✅ Identified as handshake message');
            return 'handshake';
        }
        // Check for event messages using EventNode type
        if (this.isEventNode(message)) {
            console.log('✅ Identified as event message');
            return 'event';
        }
        console.log('❌ Unknown message type');
        return 'unknown';
    }
    /**
     * Type guard to check if message is a valid handshake message
     * @param message - Message to validate
     * @returns True if message is a valid HandshakeMessage
     */
    isHandshakeMessage(message) {
        return (typeof message === 'object' &&
            message.type === 'handshake' &&
            typeof message.clientId === 'string' &&
            typeof message.lastKnownLamportTs === 'number');
    }
    /**
     * Type guard to check if message is a valid event node
     * @param message - Message to validate
     * @returns True if message is a valid EventNode
     */
    isEventNode(message) {
        return (typeof message === 'object' &&
            typeof message.id === 'string' &&
            typeof message.lamportTs === 'number' &&
            typeof message.timestamp === 'string' &&
            typeof message.action === 'string' &&
            typeof message.nodeType === 'string' &&
            typeof message.nodeId === 'string' &&
            message.data !== undefined);
    }
    /**
     * Handle client synchronization during handshake
     *
     * When a client connects, it sends its last known Lamport timestamp.
     * This method sends all events that occurred after that timestamp
     * to bring the client up to date.
     *
     * @param handshakeData - Client handshake information
     * @param ws - WebSocket connection to send updates to
     */
    handleClientSync(handshakeData, ws) {
        console.log('🤝 Processing handshake for client:', handshakeData.clientId);
        console.log('📊 Client last known Lamport timestamp:', handshakeData.lastKnownLamportTs);
        // Send events since client's last known timestamp
        const eventsSince = this.getEventsSince(handshakeData.lastKnownLamportTs);
        console.log(`📤 Sending ${eventsSince.length} events since timestamp ${handshakeData.lastKnownLamportTs}`);
        if (eventsSince.length > 0) {
            eventsSince.forEach((event, index) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(event));
                    console.log(`📤 Sent event ${index + 1}/${eventsSince.length}:`, event.action, event.nodeType, event.nodeId);
                }
            });
        }
        else {
            console.log('📤 No missing events to send');
        }
        console.log('✅ Handshake completed for client:', handshakeData.clientId);
    }
    /**
     * Process a single event from a client
     *
     * Validates the event, updates the server's Lamport counter,
     * stores the event, and broadcasts it to all connected clients.
     *
     * @param eventData - Event data from client
     */
    handleSingleEvent(eventData) {
        // Validate that required fields exist
        if (!eventData.id) {
            console.error('❌ Event missing required ID field:', eventData);
            return;
        }
        // Validate and potentially update the event
        const event = {
            id: eventData.id,
            action: eventData.action,
            nodeType: eventData.nodeType,
            nodeId: eventData.nodeId,
            data: eventData.data,
            lamportTs: eventData.lamportTs || 0,
            timestamp: eventData.timestamp || new Date().toISOString()
        };
        // Update server's Lamport counter to be higher than the event's timestamp
        if (event.lamportTs >= this.lamportCounter) {
            this.lamportCounter = event.lamportTs + 1;
        }
        // Store event and broadcast to all clients
        this.events.push(event);
        this.broadcastEvent(event);
    }
    /**
     * Broadcast an event to all connected clients
     * @param event - Event to broadcast
     */
    broadcastEvent(event) {
        const message = JSON.stringify(event);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    /**
     * Get all events that occurred after a given Lamport timestamp
     * @param timestamp - Lamport timestamp to filter from
     * @returns Array of events with lamportTs >= timestamp
     */
    getEventsSince(timestamp) {
        const eventsSince = this.events.filter(event => event.lamportTs >= timestamp);
        console.log(`🔍 getEventsSince(${timestamp}): found ${eventsSince.length} events out of ${this.events.length} total events`);
        return eventsSince;
    }
    /**
     * Get the current Lamport counter value
     * @returns Current Lamport counter
     */
    getCurrentLamportCounter() {
        return this.lamportCounter;
    }
    // ===== TEST HELPER METHODS =====
    // These methods are used for testing and debugging purposes
    /**
     * Get a copy of all stored events (for testing)
     */
    getEvents() {
        return [...this.events];
    }
    /**
     * Get the number of connected clients (for testing)
     */
    getClientsCount() {
        return this.clients.size;
    }
    /**
     * Manually add a client (for testing)
     */
    addClient(ws) {
        this.clients.add(ws);
    }
    /**
     * Manually remove a client (for testing)
     */
    removeClient(ws) {
        this.clients.delete(ws);
    }
    /**
     * Set events array (for testing)
     */
    setEvents(events) {
        this.events = [...events];
    }
    /**
     * Set Lamport counter (for testing)
     */
    setLamportCounter(counter) {
        this.lamportCounter = counter;
    }
}
//# sourceMappingURL=WebSocketService.js.map