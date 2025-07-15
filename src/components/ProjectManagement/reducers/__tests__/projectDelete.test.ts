import { projectsReducer } from '../projectReducer';
import { ProjectNode } from '../../../../../shared/types';

describe('projectsReducer - DELETE_PROJECT', () => {
    const initialState: ProjectNode[] = [];

    it('should delete project when timestamp is higher', () => {
        const projectToDelete: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const state = [projectToDelete];

        const action = {
            type: 'DELETE_PROJECT' as const,
            payload: { projectId: 'project-1', lamportTs: 2 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(0);
    });

    it('should skip delete when timestamp is lower (LWW)', () => {
        const projectToDelete: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 5
        };

        const state = [projectToDelete];

        const action = {
            type: 'DELETE_PROJECT' as const,
            payload: { projectId: 'project-1', lamportTs: 3 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(projectToDelete); // Should remain unchanged
    });

    it('should apply local project delete immediately regardless of timestamp', () => {
        const projectToDelete: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 10
        };

        const state = [projectToDelete];

        const action = {
            type: 'DELETE_PROJECT' as const,
            payload: { projectId: 'project-1', lamportTs: 5, isLocal: true } // Lower timestamp
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(0); // Should delete immediately
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
            type: 'DELETE_PROJECT' as const,
            payload: { projectId: 'unknown-project', lamportTs: 2 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(existingProject); // Should remain unchanged
    });

    it('should handle multiple projects correctly', () => {
        const project1: ProjectNode = {
            id: 'project-1',
            name: 'Project 1',
            description: 'Description 1',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const project2: ProjectNode = {
            id: 'project-2',
            name: 'Project 2',
            description: 'Description 2',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const state = [project1, project2];

        const action = {
            type: 'DELETE_PROJECT' as const,
            payload: { projectId: 'project-1', lamportTs: 2 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(project2); // Only project2 should remain
    });
}); 