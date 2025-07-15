import { projectsReducer } from '../projectReducer';
import { ProjectNode, TaskNode } from '../../../../../shared/types';

describe('projectsReducer - DELETE_TASK', () => {
    const initialState: ProjectNode[] = [];

    it('should delete task when timestamp is higher', () => {
        const taskToDelete: TaskNode = {
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
            tasks: [taskToDelete],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const state = [project];

        const action = {
            type: 'DELETE_TASK' as const,
            payload: { taskId: 'task-1', lamportTs: 2 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(0);
    });

    it('should skip task delete when timestamp is lower (LWW)', () => {
        const taskToDelete: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Test Task',
            status: 'in_progress',
            configuration: {
                priority: 2,
                description: 'Test Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 5
        };

        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [taskToDelete],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const state = [project];

        const action = {
            type: 'DELETE_TASK' as const,
            payload: { taskId: 'task-1', lamportTs: 3 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(1);
        expect(result[0].tasks[0]).toEqual(taskToDelete); // Should remain unchanged
    });

    it('should apply local task delete immediately regardless of timestamp', () => {
        const taskToDelete: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Test Task',
            status: 'completed',
            configuration: {
                priority: 3,
                description: 'Test Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 10
        };

        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [taskToDelete],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const state = [project];

        const action = {
            type: 'DELETE_TASK' as const,
            payload: { taskId: 'task-1', lamportTs: 5, isLocal: true } // Lower timestamp
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(0); // Should delete immediately
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
            type: 'DELETE_TASK' as const,
            payload: { taskId: 'unknown-task', lamportTs: 2 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(1);
        expect(result[0].tasks[0]).toEqual(existingTask); // Should remain unchanged
    });

    it('should handle unknown project ID gracefully', () => {
        const action = {
            type: 'DELETE_TASK' as const,
            payload: { taskId: 'task-1', lamportTs: 2 }
        };

        const result = projectsReducer(initialState, action);

        expect(result).toHaveLength(0); // Should not affect state
    });

    it('should handle multiple tasks in same project', () => {
        const task1: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Task 1',
            status: 'pending',
            configuration: {
                priority: 1,
                description: 'Description 1'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const task2: TaskNode = {
            id: 'task-2',
            projectId: 'project-1',
            title: 'Task 2',
            status: 'in_progress',
            configuration: {
                priority: 2,
                description: 'Description 2'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [task1, task2],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const state = [project];

        const action = {
            type: 'DELETE_TASK' as const,
            payload: { taskId: 'task-1', lamportTs: 2 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(1);
        expect(result[0].tasks[0]).toEqual(task2); // Only task2 should remain
    });
}); 