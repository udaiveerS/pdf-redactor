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
import { WebSocket } from 'ws';
import { Server } from 'http';
import type { EventNode, HandshakeMessage } from '../shared/types';
/**
 * Configuration options for WebSocketService initialization
 */
export interface WebSocketServiceOptions {
    initialEvents?: EventNode[];
    initialLamportCounter?: number;
}
/**
 * WebSocketService - Core real-time collaboration server
 *
 * Manages WebSocket connections and provides real-time synchronization
 * for collaborative project management features.
 */
export declare class WebSocketService {
    private wss;
    private clients;
    private events;
    private lamportCounter;
    /**
     * Initialize WebSocket service with HTTP server
     * @param server - HTTP server to attach WebSocket to
     * @param options - Optional configuration for testing/initialization
     */
    constructor(server: Server, options?: WebSocketServiceOptions);
    /**
     * Initialize the service state with events and Lamport counter
     * @param options - Optional initial state configuration
     */
    private initializeState;
    /**
     * Set up WebSocket event handlers for connection management
     */
    private setupEventHandlers;
    /**
     * Route incoming messages to appropriate handlers based on message type
     * @param message - Raw message string from client
     * @param ws - WebSocket connection that sent the message
     */
    private routeMessage;
    /**
     * Determine the type of incoming message for proper routing
     * @param message - Parsed message object
     * @returns Message type or 'unknown' if unrecognized
     */
    private getMessageType;
    /**
     * Type guard to check if message is a valid handshake message
     * @param message - Message to validate
     * @returns True if message is a valid HandshakeMessage
     */
    private isHandshakeMessage;
    /**
     * Type guard to check if message is a valid event node
     * @param message - Message to validate
     * @returns True if message is a valid EventNode
     */
    private isEventNode;
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
    handleClientSync(handshakeData: HandshakeMessage, ws: WebSocket | {
        send: (data: string) => void;
        readyState: number;
    }): void;
    /**
     * Process a single event from a client
     *
     * Validates the event, updates the server's Lamport counter,
     * stores the event, and broadcasts it to all connected clients.
     *
     * @param eventData - Event data from client
     */
    handleSingleEvent(eventData: EventNode): void;
    /**
     * Broadcast an event to all connected clients
     * @param event - Event to broadcast
     */
    broadcastEvent(event: EventNode): void;
    /**
     * Get all events that occurred after a given Lamport timestamp
     * @param timestamp - Lamport timestamp to filter from
     * @returns Array of events with lamportTs >= timestamp
     */
    private getEventsSince;
    /**
     * Get the current Lamport counter value
     * @returns Current Lamport counter
     */
    getCurrentLamportCounter(): number;
    /**
     * Get a copy of all stored events (for testing)
     */
    getEvents(): EventNode[];
    /**
     * Get the number of connected clients (for testing)
     */
    getClientsCount(): number;
    /**
     * Manually add a client (for testing)
     */
    addClient(ws: WebSocket | {
        send: (data: string) => void;
        readyState: number;
    }): void;
    /**
     * Manually remove a client (for testing)
     */
    removeClient(ws: WebSocket | {
        send: (data: string) => void;
        readyState: number;
    }): void;
    /**
     * Set events array (for testing)
     */
    setEvents(events: EventNode[]): void;
    /**
     * Set Lamport counter (for testing)
     */
    setLamportCounter(counter: number): void;
}
//# sourceMappingURL=WebSocketService.d.ts.map