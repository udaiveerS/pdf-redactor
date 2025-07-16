import { mapReducer, MapAction } from '../mapReducer';
import { createInitialState } from '../types';
import { TaskNode } from '../../../../../shared/types';

describe('Map-based Reducer - UPDATE_TASK', () => {
    let initialState: ReturnType<typeof createInitialState>;

    beforeEach(() => {
        initialState = createInitialState();
    });

    it('should update an existing task', () => {
        const task: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Original Task',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        initialState.tasks.set('task-1', task);

        const updatedTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Updated Task',
            status: 'completed',
            configuration: { priority: 2 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 2
        };

        const action: MapAction = {
            type: 'UPDATE_TASK',
            payload: { taskId: 'task-1', task: updatedTask, lamportTs: 2, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        expect(newState.tasks.get('task-1')).toEqual({
            ...updatedTask,
            lamportTs: 2
        });
    });

    it('should handle remote task update with LWW logic', () => {
        const task: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Original Task',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5
        };

        initialState.tasks.set('task-1', task);

        const updatedTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Updated Task',
            status: 'completed',
            configuration: { priority: 2 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 3
        };

        const action: MapAction = {
            type: 'UPDATE_TASK',
            payload: { taskId: 'task-1', task: updatedTask, lamportTs: 3, isLocal: false }
        };

        const newState = mapReducer(initialState, action);

        // Should not update because new timestamp (3) < existing timestamp (5)
        expect(newState.tasks.get('task-1')).toEqual(task);
    });

    it('should handle update of non-existent task', () => {
        const updatedTask: TaskNode = {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Updated Task',
            status: 'completed',
            configuration: { priority: 2 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 2
        };

        const action: MapAction = {
            type: 'UPDATE_TASK',
            payload: { taskId: 'task-1', task: updatedTask, lamportTs: 2, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        // Should not change state
        expect(newState).toEqual(initialState);
    });
}); 