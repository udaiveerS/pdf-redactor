import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import type { EventNode, HandshakeMessage, MessageType, EventAction, EntityType, UnknownMessageType } from '../shared/types';
import { InitialStateManager } from './initialState.js';

export interface WebSocketServiceOptions {
    initialEvents?: EventNode[];
    initialLamportCounter?: number;
}

export class WebSocketService {
    private wss: WebSocketServer;
    private clients: Set<WebSocket> = new Set();
    private events: EventNode[] = [];
    private lamportCounter = 0;

    constructor(server: Server, options?: WebSocketServiceOptions) {
        this.wss = new WebSocketServer({ server });
        this.initializeState(options);
        this.setupEventHandlers();
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 'unknown';
        console.log(`✓ WebSocket server ready on ws://localhost:${port}`);
    }

    private initializeState(options?: WebSocketServiceOptions): void {
        if (options?.initialEvents !== undefined && options?.initialLamportCounter !== undefined) {
            this.events = [...options.initialEvents];
            this.lamportCounter = options.initialLamportCounter;
        } else {
            const initialStateManager = new InitialStateManager();
            this.events = initialStateManager.createInitialEvents();
            this.lamportCounter = initialStateManager.getInitialLamportCounter();
        }

        console.log('📊 Initialized state:');
        console.log(`   - Events count: ${this.events.length}`);
        console.log(`   - Lamport counter: ${this.lamportCounter}`);
        this.events.forEach((event, index) => {
            console.log(`   - Event ${index + 1}: ${event.action} ${event.nodeType} ${event.nodeId}`);
        });
    }

    private setupEventHandlers(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            console.log('🔗 Client connected to WebSocket');
            this.clients.add(ws);

            ws.on('message', (data: Buffer) => {
                const message = data.toString();
                this.routeMessage(message, ws);
            });

            ws.on('close', () => {
                console.log('🔌 Client disconnected from WebSocket');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
    }

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

    private isHandshakeMessage(message: any): message is HandshakeMessage {
        return (
            typeof message === 'object' &&
            message.type === 'handshake' &&
            typeof message.clientId === 'string' &&
            typeof message.lastKnownLamportTs === 'number'
        );
    }

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
                    console.log(`�� Sent event ${index + 1}/${eventsSince.length}:`, event.action, event.nodeType, event.nodeId);
                }
            });
        } else {
            console.log('📤 No missing events to send');
        }

        console.log('✅ Handshake completed for client:', handshakeData.clientId);
    }

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

        this.events.push(event);
        this.broadcastEvent(event);
    }

    public broadcastEvent(event: EventNode): void {
        const message = JSON.stringify(event);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    private getEventsSince(timestamp: number): EventNode[] {
        const eventsSince = this.events.filter(event => event.lamportTs >= timestamp);
        console.log(`🔍 getEventsSince(${timestamp}): found ${eventsSince.length} events out of ${this.events.length} total events`);
        return eventsSince;
    }

    public getCurrentLamportCounter(): number {
        return this.lamportCounter;
    }

    // Test helper methods
    public getEvents(): EventNode[] {
        return [...this.events];
    }

    public getClientsCount(): number {
        return this.clients.size;
    }

    public addClient(ws: WebSocket | { send: (data: string) => void; readyState: number }): void {
        this.clients.add(ws as WebSocket);
    }

    public removeClient(ws: WebSocket | { send: (data: string) => void; readyState: number }): void {
        this.clients.delete(ws as WebSocket);
    }

    public setEvents(events: EventNode[]): void {
        this.events = [...events];
    }

    public setLamportCounter(counter: number): void {
        this.lamportCounter = counter;
    }
} 