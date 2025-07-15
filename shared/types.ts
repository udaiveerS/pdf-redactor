// shared/types.ts

export type ID = string;
export type ISOTime = string;

export type EntityType = 'task' | 'project';
export type EventAction = 'create' | 'update' | 'delete';
export type UnknownMessageType = 'unknown';

export interface EventNode {
    id: string;
    lamportTs: number;
    timestamp: string;
    action: EventAction;
    nodeType: EntityType;
    nodeId: string;
    data: ProjectNode | TaskNode;
}

export type MessageType = 'handshake' | 'event';

export interface HandshakeMessage {
    type: 'handshake';
    clientId: string;
    lastKnownLamportTs: number;
}

export interface HandshakeResponseMessage {
    type: 'handshake_response';
    serverLamportTs: number;
    missingEvents: EventNode[];
}

export interface WebSocketMessage {
    type: MessageType;
}

export interface TaskNode {
    id: string;
    projectId: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    configuration: {
        priority: number;
        description?: string;
        dueDate?: string;
    };
    createdAt: string;
    updatedAt: string;
    lamportTs?: number;
}

export interface ProjectNode {
    id: string;
    name: string;
    description: string;
    tasks: TaskNode[];
    createdAt: string;
    updatedAt: string;
    lamportTs?: number;
} 