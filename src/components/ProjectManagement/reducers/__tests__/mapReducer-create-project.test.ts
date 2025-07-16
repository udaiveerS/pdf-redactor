import { mapReducer, MapAction } from '../mapReducer';
import { createInitialState } from '../types';
import { ProjectNode } from '../../../../../shared/types';

describe('Map-based Reducer - CREATE_PROJECT', () => {
    let initialState: ReturnType<typeof createInitialState>;

    beforeEach(() => {
        initialState = createInitialState();
    });

    it('should create a new project', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const action: MapAction = {
            type: 'CREATE_PROJECT',
            payload: { project, lamportTs: 1, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        expect(newState.projects.get('project-1')).toEqual({
            ...project,
            lamportTs: 1
        });
        expect(newState.projects.size).toBe(1);
    });

    it('should handle remote project creation with LWW logic', () => {
        const existingProject: ProjectNode = {
            id: 'project-1',
            name: 'Existing Project',
            description: 'Existing Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5
        };

        initialState.projects.set('project-1', existingProject);

        const newProject: ProjectNode = {
            id: 'project-1',
            name: 'New Project',
            description: 'New Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 3
        };

        const action: MapAction = {
            type: 'CREATE_PROJECT',
            payload: { project: newProject, lamportTs: 3, isLocal: false }
        };

        const newState = mapReducer(initialState, action);

        // Should not update because new timestamp (3) < existing timestamp (5)
        expect(newState.projects.get('project-1')).toEqual(existingProject);
    });

    it('should handle local project creation with same ID', () => {
        const existingProject: ProjectNode = {
            id: 'project-1',
            name: 'Existing Project',
            description: 'Existing Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5
        };

        initialState.projects.set('project-1', existingProject);

        const newProject: ProjectNode = {
            id: 'project-1',
            name: 'New Project',
            description: 'New Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 3
        };

        const action: MapAction = {
            type: 'CREATE_PROJECT',
            payload: { project: newProject, lamportTs: 3, isLocal: true }
        };

        const newState = mapReducer(initialState, action);

        // Should update because it's a local operation
        expect(newState.projects.get('project-1')).toEqual({
            ...newProject,
            lamportTs: 3
        });
    });
}); 