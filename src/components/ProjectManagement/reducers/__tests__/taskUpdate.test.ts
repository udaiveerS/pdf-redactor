import { projectsReducer } from '../projectReducer';
import { ProjectNode, TaskNode } from '../../../../../shared/types';

describe('projectsReducer - UPDATE_TASK', () => {
    const initialState: ProjectNode[] = [];

    it('should update existing task when timestamp is higher', () => {
        const existingTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Old Title',
            status: 'pending',
            configuration: {
                priority: 1,
                description: 'Old Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const updatedTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'New Title',
            status: 'in_progress',
            configuration: {
                priority: 2,
                description: 'New Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 2
        };

        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [existingTask],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const state = [project];

        const action = {
            type: 'UPDATE_TASK' as const,
            payload: { taskId: 'task-1', task: updatedTask, lamportTs: 2 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(1);
        expect(result[0].tasks[0]).toEqual(updatedTask);
    });

    it('should skip task update when timestamp is lower (LWW)', () => {
        const existingTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Current Title',
            status: 'in_progress',
            configuration: {
                priority: 2,
                description: 'Current Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 5
        };

        const olderUpdate: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Older Title',
            status: 'pending',
            configuration: {
                priority: 1,
                description: 'Older Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 3
        };

        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [existingTask],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const state = [project];

        const action = {
            type: 'UPDATE_TASK' as const,
            payload: { taskId: 'task-1', task: olderUpdate, lamportTs: 3 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(1);
        expect(result[0].tasks[0]).toEqual(existingTask); // Should remain unchanged
    });

    it('should apply local task update immediately regardless of timestamp', () => {
        const existingTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Current Title',
            status: 'in_progress',
            configuration: {
                priority: 2,
                description: 'Current Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 10
        };

        const localUpdate: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Local Title',
            status: 'completed',
            configuration: {
                priority: 3,
                description: 'Local Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5 // Lower timestamp
        };

        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [existingTask],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const state = [project];

        const action = {
            type: 'UPDATE_TASK' as const,
            payload: { taskId: 'task-1', task: localUpdate, lamportTs: 5, isLocal: true }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(1);
        expect(result[0].tasks[0]).toEqual(localUpdate); // Should apply immediately
    });

    it('should handle unknown task ID gracefully', () => {
        const existingTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Test Task',
            status: 'pending',
            configuration: {
                priority: 1,
                description: 'Test Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [existingTask],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const state = [project];

        const action = {
            type: 'UPDATE_TASK' as const,
            payload: {
                taskId: 'unknown-task',
                task: { ...existingTask, id: 'unknown-task' },
                lamportTs: 2
            }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(1);
        expect(result[0].tasks[0]).toEqual(existingTask); // Should remain unchanged
    });

    it('should handle unknown project ID gracefully', () => {
        const task: TaskNode = {
            id: 'task-1',
            projectId: 'unknown-project',
            title: 'Test Task',
            status: 'pending',
            configuration: {
                priority: 1,
                description: 'Test Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 2
        };

        const action = {
            type: 'UPDATE_TASK' as const,
            payload: { taskId: 'task-1', task, lamportTs: 2 }
        };

        const result = projectsReducer(initialState, action);

        expect(result).toHaveLength(0); // Should not affect state
    });
}); 