import { mapReducer, MapAction } from '../mapReducer';
import { createInitialState } from '../types';
import { ProjectNode, TaskNode } from '../../../../../shared/types';

describe('Map-based Reducer - DELETE_TASK', () => {
    let initialState: ReturnType<typeof createInitialState>;

    beforeEach(() => {
        initialState = createInitialState();
    });

    it('should delete a task and remove from project taskIds', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: ['task-1', 'task-2'],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

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

        const task2: TaskNode = {
            id: 'task-2',
            projectId: 'project-1',
            title: 'Task 2',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 3
        };

        initialState.projects.set('project-1', project);
        initialState.tasks.set('task-1', task1);
        initialState.tasks.set('task-2', task2);

        const action: MapAction = {
            type: 'DELETE_TASK',
            payload: { taskId: 'task-1', lamportTs: 4, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        // Check task was removed from tasks map
        expect(newState.tasks.has('task-1')).toBe(false);
        expect(newState.tasks.has('task-2')).toBe(true);

        // Check project taskIds was updated
        const updatedProject = newState.projects.get('project-1');
        expect(updatedProject?.taskIds).toEqual(['task-2']);
        expect(updatedProject?.updatedAt).toBeDefined();
    });

    it('should handle remote task deletion with LWW logic', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: ['task-1'],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const task: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Task 1',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5
        };

        initialState.projects.set('project-1', project);
        initialState.tasks.set('task-1', task);

        const action: MapAction = {
            type: 'DELETE_TASK',
            payload: { taskId: 'task-1', lamportTs: 3, isLocal: false }
        };

        const newState = mapReducer(initialState, action);

        // Should not delete because new timestamp (3) < existing timestamp (5)
        expect(newState.tasks.has('task-1')).toBe(true);
        expect(newState.tasks.get('task-1')).toEqual(task);
    });

    it('should handle deletion of non-existent task', () => {
        const action: MapAction = {
            type: 'DELETE_TASK',
            payload: { taskId: 'non-existent-task', lamportTs: 2, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        // Should not change state
        expect(newState).toEqual(initialState);
    });

    // New test to reproduce the UI issue where deleting one task affects multiple tasks
    it('should only delete the specified task when multiple tasks exist', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: ['task-1', 'task-2', 'task-3'],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

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

        const task3: TaskNode = {
            id: 'task-3',
            projectId: 'project-1',
            title: 'Task 3',
            status: 'completed',
            configuration: { priority: 3 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 4
        };

        initialState.projects.set('project-1', project);
        initialState.tasks.set('task-1', task1);
        initialState.tasks.set('task-2', task2);
        initialState.tasks.set('task-3', task3);

        // Verify initial state
        expect(initialState.tasks.size).toBe(3);
        expect(initialState.projects.get('project-1')?.taskIds).toEqual(['task-1', 'task-2', 'task-3']);

        // Delete only task-2
        const action: MapAction = {
            type: 'DELETE_TASK',
            payload: { taskId: 'task-2', lamportTs: 5, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        // Check that only task-2 was deleted
        expect(newState.tasks.has('task-1')).toBe(true);
        expect(newState.tasks.has('task-2')).toBe(false);
        expect(newState.tasks.has('task-3')).toBe(true);

        // Check that task-2 was removed from project taskIds
        const updatedProject = newState.projects.get('project-1');
        expect(updatedProject?.taskIds).toEqual(['task-1', 'task-3']);

        // Verify task-1 and task-3 are unchanged
        expect(newState.tasks.get('task-1')).toEqual(task1);
        expect(newState.tasks.get('task-3')).toEqual(task3);
    });

    // Test to reproduce the Date.now() vs Lamport counter issue
    it('should handle delete when task was created with Date.now() timestamp', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: ['task-1'],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        // Simulate task created with Date.now() (very high timestamp)
        const taskWithHighTimestamp: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Task with Date.now() timestamp',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1752808026463 // Simulates Date.now() value
        };

        initialState.projects.set('project-1', project);
        initialState.tasks.set('task-1', taskWithHighTimestamp);

        // Try to delete with proper Lamport counter (low timestamp)
        const action: MapAction = {
            type: 'DELETE_TASK',
            payload: { taskId: 'task-1', lamportTs: 27, isLocal: false }
        };

        const newState = mapReducer(initialState, action);

        // Should NOT delete because 27 < 1752808026463 (LWW logic)
        expect(newState.tasks.has('task-1')).toBe(true);
        expect(newState.tasks.get('task-1')).toEqual(taskWithHighTimestamp);
        expect(newState.projects.get('project-1')?.taskIds).toEqual(['task-1']);
    });

    // Test to verify that proper Lamport counter sequence works
    it('should handle delete when task was created with proper Lamport counter', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: ['task-1'],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        // Task created with proper Lamport counter
        const taskWithProperTimestamp: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Task with proper Lamport timestamp',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 27 // Proper incremental Lamport counter
        };

        initialState.projects.set('project-1', project);
        initialState.tasks.set('task-1', taskWithProperTimestamp);

        // Delete with higher Lamport counter
        const action: MapAction = {
            type: 'DELETE_TASK',
            payload: { taskId: 'task-1', lamportTs: 28, isLocal: false }
        };

        const newState = mapReducer(initialState, action);

        // Should delete because 28 > 27 (LWW logic)
        expect(newState.tasks.has('task-1')).toBe(false);
        expect(newState.projects.get('project-1')?.taskIds).toEqual([]);
    });

    // Test to check if there's an issue with task IDs being the same
    it('should handle tasks with different IDs correctly', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: ['unique-task-1', 'unique-task-2'],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const task1: TaskNode = {
            id: 'unique-task-1',
            projectId: 'project-1',
            title: 'Unique Task 1',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 2
        };

        const task2: TaskNode = {
            id: 'unique-task-2',
            projectId: 'project-1',
            title: 'Unique Task 2',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 3
        };

        initialState.projects.set('project-1', project);
        initialState.tasks.set('unique-task-1', task1);
        initialState.tasks.set('unique-task-2', task2);

        // Delete task1
        const action: MapAction = {
            type: 'DELETE_TASK',
            payload: { taskId: 'unique-task-1', lamportTs: 4, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        // Verify only task1 was deleted
        expect(newState.tasks.has('unique-task-1')).toBe(false);
        expect(newState.tasks.has('unique-task-2')).toBe(true);
        expect(newState.tasks.get('unique-task-2')).toEqual(task2);

        // Verify project taskIds
        const updatedProject = newState.projects.get('project-1');
        expect(updatedProject?.taskIds).toEqual(['unique-task-2']);
    });
}); 