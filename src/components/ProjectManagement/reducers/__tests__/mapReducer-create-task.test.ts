import { mapReducer, MapAction } from '../mapReducer';
import { createInitialState } from '../types';
import { ProjectNode, TaskNode } from '../../../../../shared/types';

describe('Map-based Reducer - CREATE_TASK', () => {
    let initialState: ReturnType<typeof createInitialState>;

    beforeEach(() => {
        initialState = createInitialState();
    });

    it('should create a new task and update project taskIds', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        initialState.projects.set('project-1', project);

        const task: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Test Task',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 2
        };

        const action: MapAction = {
            type: 'CREATE_TASK',
            payload: { task, lamportTs: 2, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        // Check task was added to tasks map
        expect(newState.tasks.get('task-1')).toEqual({
            ...task,
            lamportTs: 2
        });

        // Check project was updated with task ID
        const updatedProject = newState.projects.get('project-1');
        expect(updatedProject?.taskIds).toContain('task-1');
        expect(updatedProject?.updatedAt).toBeDefined();
    });

    it('should handle task creation for non-existent project', () => {
        const task: TaskNode = {
            id: 'task-1',
            projectId: 'non-existent-project',
            title: 'Test Task',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 2
        };

        const action: MapAction = {
            type: 'CREATE_TASK',
            payload: { task, lamportTs: 2, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        // Should not change state
        expect(newState).toEqual(initialState);
    });

    it('should handle remote task creation with LWW logic', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const existingTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Existing Task',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5
        };

        initialState.projects.set('project-1', project);
        initialState.tasks.set('task-1', existingTask);

        const newTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'New Task',
            status: 'completed',
            configuration: { priority: 2 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 3
        };

        const action: MapAction = {
            type: 'CREATE_TASK',
            payload: { task: newTask, lamportTs: 3, isLocal: false }
        };

        const newState = mapReducer(initialState, action);

        // Should not update because new timestamp (3) < existing timestamp (5)
        expect(newState.tasks.get('task-1')).toEqual(existingTask);
    });

    // New test to check for potential duplicate task creation issues
    it('should handle multiple task creations correctly without duplicates', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        initialState.projects.set('project-1', project);

        // Create first task
        const task1: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Task 1',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 2
        };

        const action1: MapAction = {
            type: 'CREATE_TASK',
            payload: { task: task1, lamportTs: 2, isLocal: true }
        };

        let newState = mapReducer(initialState, action1);

        // Verify first task was created
        expect(newState.tasks.has('task-1')).toBe(true);
        expect(newState.projects.get('project-1')?.taskIds).toEqual(['task-1']);

        // Create second task
        const task2: TaskNode = {
            id: 'task-2',
            projectId: 'project-1',
            title: 'Task 2',
            status: 'in_progress',
            configuration: { priority: 2 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 3
        };

        const action2: MapAction = {
            type: 'CREATE_TASK',
            payload: { task: task2, lamportTs: 3, isLocal: true }
        };

        newState = mapReducer(newState, action2);

        // Verify both tasks exist and project has both task IDs
        expect(newState.tasks.has('task-1')).toBe(true);
        expect(newState.tasks.has('task-2')).toBe(true);
        expect(newState.tasks.size).toBe(2);
        expect(newState.projects.get('project-1')?.taskIds).toEqual(['task-1', 'task-2']);

        // Verify tasks have different IDs and content
        expect(newState.tasks.get('task-1')?.id).toBe('task-1');
        expect(newState.tasks.get('task-2')?.id).toBe('task-2');
        expect(newState.tasks.get('task-1')?.title).toBe('Task 1');
        expect(newState.tasks.get('task-2')?.title).toBe('Task 2');
    });

    // Test to check if creating a task with the same ID as existing task works correctly
    it('should handle creating task with same ID as existing task', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: ['task-1'],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const existingTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Existing Task',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 2
        };

        initialState.projects.set('project-1', project);
        initialState.tasks.set('task-1', existingTask);

        // Try to create a task with the same ID but different content
        const newTask: TaskNode = {
            id: 'task-1', // Same ID
            projectId: 'project-1',
            title: 'New Task Title',
            status: 'completed',
            configuration: { priority: 3 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5 // Higher timestamp
        };

        const action: MapAction = {
            type: 'CREATE_TASK',
            payload: { task: newTask, lamportTs: 5, isLocal: false }
        };

        const newState = mapReducer(initialState, action);

        // Should replace the existing task because new timestamp is higher
        expect(newState.tasks.has('task-1')).toBe(true);
        expect(newState.tasks.get('task-1')?.title).toBe('New Task Title');
        expect(newState.tasks.get('task-1')?.status).toBe('completed');
        expect(newState.tasks.get('task-1')?.lamportTs).toBe(5);

        // Project should still have only one task ID
        expect(newState.projects.get('project-1')?.taskIds).toEqual(['task-1']);
    });

    // Test to verify that processing the same task multiple times doesn't create duplicates
    it('should prevent duplicate task IDs when same task is processed multiple times', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        initialState.projects.set('project-1', project);

        const task: TaskNode = {
            id: 'duplicate-task-1',
            projectId: 'project-1',
            title: 'Duplicate Task',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 2
        };

        // First time creating the task
        const action1: MapAction = {
            type: 'CREATE_TASK',
            payload: { task, lamportTs: 2, isLocal: true }
        };

        let newState = mapReducer(initialState, action1);

        // Verify task was created and added to project
        expect(newState.tasks.has('duplicate-task-1')).toBe(true);
        expect(newState.projects.get('project-1')?.taskIds).toEqual(['duplicate-task-1']);

        // Process the same task again (simulating WebSocket event duplication)
        const action2: MapAction = {
            type: 'CREATE_TASK',
            payload: { task, lamportTs: 2, isLocal: false }
        };

        newState = mapReducer(newState, action2);

        // Verify task still exists and project still has only one task ID
        expect(newState.tasks.has('duplicate-task-1')).toBe(true);
        expect(newState.projects.get('project-1')?.taskIds).toEqual(['duplicate-task-1']);
        expect(newState.projects.get('project-1')?.taskIds?.length).toBe(1);

        // Process the same task a third time
        const action3: MapAction = {
            type: 'CREATE_TASK',
            payload: { task, lamportTs: 2, isLocal: false }
        };

        newState = mapReducer(newState, action3);

        // Verify no duplicates were created
        expect(newState.tasks.has('duplicate-task-1')).toBe(true);
        expect(newState.projects.get('project-1')?.taskIds).toEqual(['duplicate-task-1']);
        expect(newState.projects.get('project-1')?.taskIds?.length).toBe(1);

        // Verify the task content is unchanged
        expect(newState.tasks.get('duplicate-task-1')?.title).toBe('Duplicate Task');
        expect(newState.tasks.get('duplicate-task-1')?.status).toBe('pending');
    });


}); 