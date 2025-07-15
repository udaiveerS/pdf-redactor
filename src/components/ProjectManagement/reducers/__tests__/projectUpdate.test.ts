import { projectsReducer } from '../projectReducer';
import { ProjectNode } from '../../../../../shared/types';

describe('projectsReducer - UPDATE_PROJECT', () => {
    const initialState: ProjectNode[] = [];

    it('should update existing project when timestamp is higher', () => {
        const existingProject: ProjectNode = {
            id: 'project-1',
            name: 'Old Name',
            description: 'Old Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const updatedProject: ProjectNode = {
            id: 'project-1',
            name: 'New Name',
            description: 'New Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 2
        };

        const state = [existingProject];

        const action = {
            type: 'UPDATE_PROJECT' as const,
            payload: { projectId: 'project-1', project: updatedProject, lamportTs: 2 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(updatedProject);
    });

    it('should skip update when timestamp is lower (LWW)', () => {
        const existingProject: ProjectNode = {
            id: 'project-1',
            name: 'Current Name',
            description: 'Current Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 5
        };

        const olderUpdate: ProjectNode = {
            id: 'project-1',
            name: 'Older Name',
            description: 'Older Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 3
        };

        const state = [existingProject];

        const action = {
            type: 'UPDATE_PROJECT' as const,
            payload: { projectId: 'project-1', project: olderUpdate, lamportTs: 3 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(existingProject); // Should remain unchanged
    });

    it('should apply local project update immediately regardless of timestamp', () => {
        const existingProject: ProjectNode = {
            id: 'project-1',
            name: 'Current Name',
            description: 'Current Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 10
        };

        const localUpdate: ProjectNode = {
            id: 'project-1',
            name: 'Local Update',
            description: 'Local Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 5 // Lower timestamp
        };

        const state = [existingProject];

        const action = {
            type: 'UPDATE_PROJECT' as const,
            payload: { projectId: 'project-1', project: localUpdate, lamportTs: 5, isLocal: true }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(localUpdate); // Should apply immediately
    });

    it('should handle unknown project ID gracefully', () => {
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
                projectId: 'unknown-project',
                project: { ...existingProject, id: 'unknown-project' },
                lamportTs: 2
            }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(existingProject); // Should remain unchanged
    });
}); 