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
import { Server } from 'http';
import type { EventNode, HandshakeMessage, MessageType, EventAction, EntityType, UnknownMessageType } from '../shared/types';
import { InitialStateManager } from './initialState.js';

/**
 * Configuration options for WebSocketService initialization
 */
export interface WebSocketServiceOptions {
    initialEvents?: EventNode[];        // Pre-populated events for testing
    initialLamportCounter?: number;     // Starting Lamport counter value
}

/**
 * WebSocketService - Core real-time collaboration server
 * 
 * Manages WebSocket connections and provides real-time synchronization
 * for collaborative project management features.
 */
export class WebSocketService {
    private wss: WebSocketServer;                    // WebSocket server instance
    private clients: Set<WebSocket> = new Set();     // Connected clients
    private events: EventNode[] = [];                // Event log for synchronization
    private lamportCounter = 0;                      // Lamport timestamp counter

    /**
     * Initialize WebSocket service with HTTP server
     * @param server - HTTP server to attach WebSocket to
     * @param options - Optional configuration for testing/initialization
     */
    constructor(server: Server, options?: WebSocketServiceOptions) {
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
    private initializeState(options?: WebSocketServiceOptions): void {
        if (options?.initialEvents !== undefined && options?.initialLamportCounter !== undefined) {
            // Use provided initial state (typically for testing)
            this.events = [...options.initialEvents];
            this.lamportCounter = options.initialLamportCounter;
        } else {
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
    private setupEventHandlers(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            console.log('🔗 Client connected to WebSocket');
            this.clients.add(ws);

            // Handle incoming messages from client
            ws.on('message', (data: Buffer) => {
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
    private routeMessage(message: string, ws: WebSocket): void {
        console.log('📨 Raw message received from client:', message);

        try {
            const parsedMessage = JSON.parse(message);
            console.log('📨 Parsed message:', parsedMessage);

            // Determine message type and route accordingly
            const messageType = this.getMessageType(parsedMessage);
            console.log('🔄 Routing message as type:', messageType);

            switch (messageType) {
                case 'handshake' as MessageType:
                    console.log('🤝 Routing to handshake handler');
                    this.handleClientSync(parsedMessage as HandshakeMessage, ws);
                    break;
                case 'event' as MessageType:
                    console.log('📝 Routing to event handler');
                    this.handleSingleEvent(parsedMessage as EventNode);
                    break;
                default:
                    console.warn('⚠️ Unknown message type:', messageType);
            }
        } catch (error) {
            console.error('❌ Error processing message:', error);
        }
    }

    /**
     * Determine the type of incoming message for proper routing
     * @param message - Parsed message object
     * @returns Message type or 'unknown' if unrecognized
     */
    private getMessageType(message: any): MessageType | UnknownMessageType {
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
        return 'unknown' as UnknownMessageType;
    }

    /**
     * Type guard to check if message is a valid handshake message
     * @param message - Message to validate
     * @returns True if message is a valid HandshakeMessage
     */
    private isHandshakeMessage(message: any): message is HandshakeMessage {
        return (
            typeof message === 'object' &&
            message.type === 'handshake' &&
            typeof message.clientId === 'string' &&
            typeof message.lastKnownLamportTs === 'number'
        );
    }

    /**
     * Type guard to check if message is a valid event node
     * @param message - Message to validate
     * @returns True if message is a valid EventNode
     */
    private isEventNode(message: any): message is EventNode {
        return (
            typeof message === 'object' &&
            typeof message.id === 'string' &&
            typeof message.lamportTs === 'number' &&
            typeof message.timestamp === 'string' &&
            typeof message.action === 'string' &&
            typeof message.nodeType === 'string' &&
            typeof message.nodeId === 'string' &&
            message.data !== undefined
        );
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
    public handleClientSync(handshakeData: HandshakeMessage, ws: WebSocket | { send: (data: string) => void; readyState: number }): void {
        console.log('🤝 Processing handshake for client:', handshakeData.clientId);
        console.log('📊 Client last known Lamport timestamp:', handshakeData.lastKnownLamportTs);

        // Send events since client's last known timestamp
        const eventsSince = this.getEventsSince(handshakeData.lastKnownLamportTs);
        console.log(`📤 Sending ${eventsSince.length} events since timestamp ${handshakeData.lastKnownLamportTs}`);

        if (eventsSince.length > 0) {
            eventsSince.forEach((event: EventNode, index: number) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(event));
                    console.log(`📤 Sent event ${index + 1}/${eventsSince.length}:`, event.action, event.nodeType, event.nodeId);
                }
            });
        } else {
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
    public handleSingleEvent(eventData: EventNode): void {
        // Validate that required fields exist
        if (!eventData.id) {
            console.error('❌ Event missing required ID field:', eventData);
            return;
        }

        // Validate and potentially update the event
        const event: EventNode = {
            id: eventData.id,
            action: eventData.action as EventAction,
            nodeType: eventData.nodeType as EntityType,
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
    public broadcastEvent(event: EventNode): void {
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
    private getEventsSince(timestamp: number): EventNode[] {
        const eventsSince = this.events.filter(event => event.lamportTs >= timestamp);
        console.log(`🔍 getEventsSince(${timestamp}): found ${eventsSince.length} events out of ${this.events.length} total events`);
        return eventsSince;
    }

    /**
     * Get the current Lamport counter value
     * @returns Current Lamport counter
     */
    public getCurrentLamportCounter(): number {
        return this.lamportCounter;
    }

    // ===== TEST HELPER METHODS =====
    // These methods are used for testing and debugging purposes

    /**
     * Get a copy of all stored events (for testing)
     */
    public getEvents(): EventNode[] {
        return [...this.events];
    }

    /**
     * Get the number of connected clients (for testing)
     */
    public getClientsCount(): number {
        return this.clients.size;
    }

    /**
     * Manually add a client (for testing)
     */
    public addClient(ws: WebSocket | { send: (data: string) => void; readyState: number }): void {
        this.clients.add(ws as WebSocket);
    }

    /**
     * Manually remove a client (for testing)
     */
    public removeClient(ws: WebSocket | { send: (data: string) => void; readyState: number }): void {
        this.clients.delete(ws as WebSocket);
    }

    /**
     * Set events array (for testing)
     */
    public setEvents(events: EventNode[]): void {
        this.events = [...events];
    }

    /**
     * Set Lamport counter (for testing)
     */
    public setLamportCounter(counter: number): void {
        this.lamportCounter = counter;
    }
} 