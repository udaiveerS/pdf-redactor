import { projectsReducer } from '../projectReducer';
import { ProjectNode, TaskNode } from '../../../../../shared/types';

describe('projectsReducer - CREATE_TASK', () => {
    const initialState: ProjectNode[] = [];

    it('should create a new task in existing project', () => {
        const existingProject: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const newTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'New Task',
            status: 'pending',
            configuration: {
                priority: 1,
                description: 'Task Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 2
        };

        const state = [existingProject];

        const action = {
            type: 'CREATE_TASK' as const,
            payload: { task: newTask, lamportTs: 2 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(1);
        expect(result[0].tasks[0]).toEqual(newTask);
    });

    it('should replace existing task when timestamp is higher (LWW)', () => {
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
            type: 'CREATE_TASK' as const,
            payload: { task: updatedTask, lamportTs: 2 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(1);
        expect(result[0].tasks[0]).toEqual(updatedTask);
    });

    it('should apply local task create immediately regardless of timestamp', () => {
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
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 10
        };

        const localTask: TaskNode = {
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
            type: 'CREATE_TASK' as const,
            payload: { task: localTask, lamportTs: 5, isLocal: true }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(1);
        expect(result[0].tasks[0]).toEqual(localTask); // Should apply immediately
    });

    it('should handle task creation for non-existent project', () => {
        const newTask: TaskNode = {
            id: 'task-1',
            projectId: 'non-existent-project',
            title: 'New Task',
            status: 'pending',
            configuration: {
                priority: 1,
                description: 'Task Description'
            },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const action = {
            type: 'CREATE_TASK' as const,
            payload: { task: newTask, lamportTs: 1 }
        };

        const result = projectsReducer(initialState, action);

        expect(result).toHaveLength(0); // Should not create project for non-existent project
    });

    it('should handle multiple tasks in same project', () => {
        const existingTask1: TaskNode = {
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

        const newTask2: TaskNode = {
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
            lamportTs: 2
        };

        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [existingTask1],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const state = [project];

        const action = {
            type: 'CREATE_TASK' as const,
            payload: { task: newTask2, lamportTs: 2 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0].tasks).toHaveLength(2);
        expect(result[0].tasks).toContainEqual(existingTask1);
        expect(result[0].tasks).toContainEqual(newTask2);
    });
}); 