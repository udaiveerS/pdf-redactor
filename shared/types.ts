// shared/types.ts

export type ID = string;
export type ISOTime = string;

export type EntityType = 'task' | 'project';
export type EventAction = 'create' | 'update' | 'delete';

export interface EventNode {
    id: ID;
    entityType: EntityType;
    entityId: ID;
    action: EventAction;
    payload?: any;
    actorId: ID;
    ts: number; // Lamport clock
}

export interface TaskNode {
    id: ID;
    projectId: ID;
    title: string;
    status: 'pending' | 'in-progress' | 'completed';
    configuration: {
        priority: number;
        description: string;
        dueDate?: ISOTime;
    };
    createdAt: ISOTime;
    updatedAt: ISOTime;
}

export interface ProjectNode {
    id: ID;
    name: string;
    description: string;
    tasks: TaskNode[];
    createdAt: ISOTime;
    updatedAt: ISOTime;
}

// API Request/Response types
export interface CreateProjectRequest {
    name: string;
    description: string;
}

export interface UpdateProjectRequest {
    id: ID;
    name?: string;
    description?: string;
}

export interface CreateTaskRequest {
    projectId: ID;
    title: string;
    description: string;
    priority?: number;
    dueDate?: ISOTime;
}

export interface UpdateTaskRequest {
    id: ID;
    projectId: ID;
    title?: string;
    description?: string;
    status?: 'pending' | 'in-progress' | 'completed';
    priority?: number;
    dueDate?: ISOTime;
} 