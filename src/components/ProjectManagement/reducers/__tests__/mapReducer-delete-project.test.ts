import { mapReducer, MapAction } from '../mapReducer';
import { createInitialState } from '../types';
import { ProjectNode } from '../../../../../shared/types';

describe('Map-based Reducer - DELETE_PROJECT', () => {
    let initialState: ReturnType<typeof createInitialState>;

    beforeEach(() => {
        initialState = createInitialState();
    });

    it('should delete a project', () => {
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

        const action: MapAction = {
            type: 'DELETE_PROJECT',
            payload: { projectId: 'project-1', lamportTs: 2, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        expect(newState.projects.has('project-1')).toBe(false);
        expect(newState.projects.size).toBe(0);
    });

    it('should handle remote project deletion with LWW logic', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5
        };

        initialState.projects.set('project-1', project);

        const action: MapAction = {
            type: 'DELETE_PROJECT',
            payload: { projectId: 'project-1', lamportTs: 3, isLocal: false }
        };

        const newState = mapReducer(initialState, action);

        // Should not delete because new timestamp (3) < existing timestamp (5)
        expect(newState.projects.has('project-1')).toBe(true);
        expect(newState.projects.get('project-1')).toEqual(project);
    });

    it('should handle deletion of non-existent project', () => {
        const action: MapAction = {
            type: 'DELETE_PROJECT',
            payload: { projectId: 'non-existent-project', lamportTs: 2, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        // Should not change state
        expect(newState).toEqual(initialState);
    });
}); 