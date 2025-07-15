import { projectsReducer } from '../projectReducer';
import { ProjectNode } from '../../../../../shared/types';

describe('projectsReducer - CREATE_PROJECT', () => {
    const initialState: ProjectNode[] = [];

    it('should create a new project when project does not exist', () => {
        const newProject: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 1
        };

        const action = {
            type: 'CREATE_PROJECT' as const,
            payload: { project: newProject, lamportTs: 1 }
        };

        const result = projectsReducer(initialState, action);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(newProject);
    });

    it('should replace existing project when new timestamp is higher (LWW)', () => {
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
            type: 'CREATE_PROJECT' as const,
            payload: { project: updatedProject, lamportTs: 2 }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(updatedProject);
    });

    it('should apply local project create immediately regardless of timestamp', () => {
        const existingProject: ProjectNode = {
            id: 'project-1',
            name: 'Old Name',
            description: 'Old Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 10
        };

        const newProject: ProjectNode = {
            id: 'project-1',
            name: 'New Name',
            description: 'New Description',
            tasks: [],
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z',
            lamportTs: 5 // Lower timestamp
        };

        const state = [existingProject];

        const action = {
            type: 'CREATE_PROJECT' as const,
            payload: { project: newProject, lamportTs: 5, isLocal: true }
        };

        const result = projectsReducer(state, action);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(newProject);
    });
}); 