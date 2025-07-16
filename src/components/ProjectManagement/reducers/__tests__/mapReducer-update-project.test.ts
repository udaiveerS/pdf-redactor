import { mapReducer, MapAction } from '../mapReducer';
import { createInitialState } from '../types';
import { ProjectNode } from '../../../../../shared/types';

describe('Map-based Reducer - UPDATE_PROJECT', () => {
    let initialState: ReturnType<typeof createInitialState>;

    beforeEach(() => {
        initialState = createInitialState();
    });

    it('should update an existing project', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Original Project',
            description: 'Original Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        initialState.projects.set('project-1', project);

        const updatedProject: ProjectNode = {
            id: 'project-1',
            name: 'Updated Project',
            description: 'Updated Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 2
        };

        const action: MapAction = {
            type: 'UPDATE_PROJECT',
            payload: { projectId: 'project-1', project: updatedProject, lamportTs: 2, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        expect(newState.projects.get('project-1')).toEqual({
            ...updatedProject,
            lamportTs: 2
        });
    });

    it('should handle remote project update with LWW logic', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Original Project',
            description: 'Original Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5
        };

        initialState.projects.set('project-1', project);

        const updatedProject: ProjectNode = {
            id: 'project-1',
            name: 'Updated Project',
            description: 'Updated Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 3
        };

        const action: MapAction = {
            type: 'UPDATE_PROJECT',
            payload: { projectId: 'project-1', project: updatedProject, lamportTs: 3, isLocal: false }
        };

        const newState = mapReducer(initialState, action);

        // Should not update because new timestamp (3) < existing timestamp (5)
        expect(newState.projects.get('project-1')).toEqual(project);
    });

    it('should handle update of non-existent project', () => {
        const updatedProject: ProjectNode = {
            id: 'project-1',
            name: 'Updated Project',
            description: 'Updated Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 2
        };

        const action: MapAction = {
            type: 'UPDATE_PROJECT',
            payload: { projectId: 'project-1', project: updatedProject, lamportTs: 2, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        // Should not change state
        expect(newState).toEqual(initialState);
    });
}); 