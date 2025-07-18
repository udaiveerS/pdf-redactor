import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { EventNode, HandshakeMessage, EventAction, EntityType } from '../../shared/types';

declare global {
    interface Window {
        __COLAB_CLIENT_ID?: string;
    }
}

export const useWebSocket = (url: string) => {
    const [isConnected, setIsConnected] = useState(false);
    const [eventQueue, setEventQueue] = useState<EventNode[]>([]);
    const ws = useRef<WebSocket | null>(null);
    const lamportCounter = useRef<number>(0);
    const clientId = useRef<string>(process.env.REACT_APP_CLIENT_ID || `client-${Date.now()}`);

    // Type guard for EventNode
    const isEventNode = (data: any): data is EventNode => {
        return (
            typeof data === 'object' &&
            typeof data.id === 'string' &&
            typeof data.lamportTs === 'number' &&
            typeof data.timestamp === 'string' &&
            typeof data.action === 'string' &&
            typeof data.nodeType === 'string' &&
            typeof data.nodeId === 'string' &&
            data.data !== undefined
        );
    };

    useEffect(() => {
        const connect = () => {
            try {
                ws.current = new WebSocket(url);

                ws.current.onopen = () => {
                    console.log('✅ WebSocket connected successfully');
                    console.log(`🔢 Current Lamport counter before handshake: ${lamportCounter.current}`);
                    setIsConnected(true);

                    // Send handshake with client's last known Lamport timestamp
                    const handshake: HandshakeMessage = {
                        type: 'handshake',
                        clientId: clientId.current,
                        lastKnownLamportTs: lamportCounter.current
                    };

                    if (ws.current) {
                        ws.current.send(JSON.stringify(handshake));
                        console.log(`🤝 Sent handshake with client ID: ${clientId.current}, last known Lamport: ${lamportCounter.current}`);
                    }
                };

                ws.current.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('📨 WebSocket message received:', data);

                        // Check if it's an event using EventNode type
                        if (isEventNode(data)) {
                            const eventData = data as EventNode;
                            console.log('📨 WebSocket event received:', eventData.action, eventData.nodeType, eventData.nodeId, `(Lamport: ${eventData.lamportTs})`);

                            // Track the highest Lamport timestamp seen from server events
                            if (eventData.lamportTs > lamportCounter.current) {
                                const oldValue = lamportCounter.current;
                                lamportCounter.current = eventData.lamportTs;
                                console.log(`🔄 Updated Lamport counter from ${oldValue} to: ${lamportCounter.current}`);
                            } else {
                                console.log(`⏭️ Skipped Lamport update - current: ${lamportCounter.current}, event: ${eventData.lamportTs}`);
                            }

                            setEventQueue(prev => {
                                // Prevent duplicates
                                const exists = prev.some(e => e.id === eventData.id);
                                if (exists) {
                                    console.log('⏭️ Skipping duplicate event:', eventData.id);
                                    return prev;
                                }

                                const newQueue = [...prev, eventData];
                                console.log(`📋 Added event to queue. Queue size: ${newQueue.length}`);
                                return newQueue;
                            });
                        } else {
                            console.log('📨 Received non-event message:', data);
                            if (data.type === 'handshake' && data.clientId) {
                                window.__COLAB_CLIENT_ID = data.clientId;
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error parsing WebSocket message:', error);
                    }
                };

                ws.current.onclose = (event) => {
                    console.log('🔌 WebSocket disconnected:', event.code);
                    console.log(`🔢 Final Lamport counter on disconnect: ${lamportCounter.current}`);
                    setIsConnected(false);
                };

                ws.current.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    setIsConnected(false);
                };
            } catch (error) {
                console.error('❌ Error creating WebSocket connection:', error);
                setIsConnected(false);
            }
        };

        connect();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [url]);

    const sendEvent = (action: EventAction, nodeType: EntityType, nodeId: string, data: any) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            // Increment Lamport counter
            const oldValue = lamportCounter.current;
            lamportCounter.current += 1;
            console.log(`📤 Incrementing Lamport counter from ${oldValue} to ${lamportCounter.current}`);

            const event: EventNode = {
                id: uuidv4(),
                lamportTs: lamportCounter.current,
                timestamp: new Date().toISOString(),
                action,
                nodeType,
                nodeId,
                data
            };

            ws.current.send(JSON.stringify(event));
            console.log('📤 Sent event:', action, nodeType, nodeId, `(Lamport: ${lamportCounter.current})`);
        } else {
            console.error('❌ WebSocket not connected');
        }
    };

    // Clear event queue after processing
    const clearEventQueue = useCallback(() => {
        setEventQueue([]);
    }, []);

    return {
        isConnected,
        eventQueue,
        clearEventQueue,
        sendEvent,
        lamportCounter: lamportCounter.current,
        clientId: clientId.current
    };
}; 