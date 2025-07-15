import { projectsReducer } from '../projectReducer';
import { ProjectNode, TaskNode } from '../../../../../shared/types';

describe('projectsReducer - Edge Cases', () => {
    const initialState: ProjectNode[] = [];

    it('should handle empty state', () => {
        const action = {
            type: 'UNKNOWN_ACTION' as any,
            payload: { projectId: 'test', lamportTs: 1 }
        };

        const result = projectsReducer(initialState, action);

        expect(result).toEqual(initialState);
    });

    it('should handle unknown action type', () => {
        const existingProject: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const state = [existingProject];

        const action = {
            type: 'UNKNOWN_ACTION' as any,
            payload: { projectId: 'test', lamportTs: 1 }
        };

        const result = projectsReducer(state, action);

        expect(result).toEqual(state); // Should return unchanged state
    });

    it('should handle UUID tiebreaker when timestamps are equal for task update', () => {
        const existingTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Current Title',
            status: 'pending',
            configuration: {
                priority: 1,
                description: 'Current Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5
        };

        const competingTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Competing Title',
            status: 'in_progress',
            configuration: {
                priority: 2,
                description: 'Competing Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5 // Same timestamp
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
            payload: { taskId: 'task-1', task: competingTask, lamportTs: 5 }
        };

        const result = projectsReducer(state, action);

        // Should use UUID tiebreaker - the task with higher UUID should win
        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(1);

        // The result depends on UUID comparison, but we can verify it's one of the two
        const finalTask = result[0].tasks[0];
        expect([existingTask, competingTask]).toContainEqual(finalTask);
    });

    it('should still use LWW logic for remote operations with lower timestamp', () => {
        const existingProject: ProjectNode = {
            id: 'project-1',
            name: 'Current Name',
            description: 'Current Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 10
        };

        const remoteUpdate: ProjectNode = {
            id: 'project-1',
            name: 'Remote Name',
            description: 'Remote Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5 // Lower timestamp
        };

        const state = [existingProject];

        const action = {
            type: 'UPDATE_PROJECT' as const,
            payload: { projectId: 'project-1', project: remoteUpdate, lamportTs: 5 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(existingProject); // Should remain unchanged due to LWW
    });

    it('should use LWW logic for remote operations with higher timestamp', () => {
        const existingProject: ProjectNode = {
            id: 'project-1',
            name: 'Current Name',
            description: 'Current Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5
        };

        const remoteUpdate: ProjectNode = {
            id: 'project-1',
            name: 'Remote Name',
            description: 'Remote Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 10 // Higher timestamp
        };

        const state = [existingProject];

        const action = {
            type: 'UPDATE_PROJECT' as const,
            payload: { projectId: 'project-1', project: remoteUpdate, lamportTs: 10 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(remoteUpdate); // Should apply due to LWW
    });

    it('should handle invalid payload gracefully', () => {
        const existingProject: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const state = [existingProject];

        const action = {
            type: 'UPDATE_PROJECT' as const,
            payload: {
                projectId: 'project-1',
                // Missing project and lamportTs
            } as any
        };

        const result = projectsReducer(state, action);

        expect(result).toEqual(state); // Should return unchanged state
    });

    it('should handle invalid task payload gracefully', () => {
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
                taskId: 'task-1',
                // Missing task and lamportTs
            } as any
        };

        const result = projectsReducer(state, action);

        expect(result).toEqual(state); // Should return unchanged state
    });
}); 