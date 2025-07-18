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

    // Test to reproduce the Date.now() vs Lamport counter issue for projects
    it('should handle delete when project was created with Date.now() timestamp', () => {
        // Simulate project created with Date.now() (very high timestamp)
        const projectWithHighTimestamp: ProjectNode = {
            id: 'project-1',
            name: 'Project with Date.now() timestamp',
            description: 'Test Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1752808026463 // Simulates Date.now() value
        };

        initialState.projects.set('project-1', projectWithHighTimestamp);

        // Try to delete with proper Lamport counter (low timestamp)
        const action: MapAction = {
            type: 'DELETE_PROJECT',
            payload: { projectId: 'project-1', lamportTs: 27, isLocal: false }
        };

        const newState = mapReducer(initialState, action);

        // Should NOT delete because 27 < 1752808026463 (LWW logic)
        expect(newState.projects.has('project-1')).toBe(true);
        expect(newState.projects.get('project-1')).toEqual(projectWithHighTimestamp);
    });

    // Test to verify that proper Lamport counter sequence works for projects
    it('should handle delete when project was created with proper Lamport counter', () => {
        // Project created with proper Lamport counter
        const projectWithProperTimestamp: ProjectNode = {
            id: 'project-1',
            name: 'Project with proper Lamport timestamp',
            description: 'Test Description',
            taskIds: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 27 // Proper incremental Lamport counter
        };

        initialState.projects.set('project-1', projectWithProperTimestamp);

        // Delete with higher Lamport counter
        const action: MapAction = {
            type: 'DELETE_PROJECT',
            payload: { projectId: 'project-1', lamportTs: 28, isLocal: false }
        };

        const newState = mapReducer(initialState, action);

        // Should delete because 28 > 27 (LWW logic)
        expect(newState.projects.has('project-1')).toBe(false);
        expect(newState.projects.size).toBe(0);
    });
}); 