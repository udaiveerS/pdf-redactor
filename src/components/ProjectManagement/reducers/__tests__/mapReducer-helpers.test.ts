import { createInitialState, getProjectsWithTasks, getTasksForProject } from '../types';
import { ProjectNode, TaskNode } from '../../../../../shared/types';

describe('Map-based Reducer - Helper Functions', () => {
    let initialState: ReturnType<typeof createInitialState>;

    beforeEach(() => {
        initialState = createInitialState();
    });

    it('should get projects with tasks populated', () => {
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
            title: 'Test Task',
            status: 'pending',
            configuration: { priority: 1 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 2
        };

        initialState.projects.set('project-1', project);
        initialState.tasks.set('task-1', task);

        const projectsWithTasks = getProjectsWithTasks(initialState);

        expect(projectsWithTasks).toHaveLength(1);
        expect(projectsWithTasks[0].tasks).toHaveLength(1);
        expect(projectsWithTasks[0].tasks[0]).toEqual(task);
    });

    it('should get tasks for a specific project', () => {
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
            status: 'completed',
            configuration: { priority: 2 },
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            lamportTs: 3
        };

        initialState.projects.set('project-1', project);
        initialState.tasks.set('task-1', task1);
        initialState.tasks.set('task-2', task2);

        const tasks = getTasksForProject(initialState, 'project-1');

        expect(tasks).toHaveLength(2);
        expect(tasks).toContainEqual(task1);
        expect(tasks).toContainEqual(task2);
    });

    it('should handle non-existent project in getTasksForProject', () => {
        const tasks = getTasksForProject(initialState, 'non-existent-project');
        expect(tasks).toHaveLength(0);
    });

    it('should handle project with non-existent tasks', () => {
        const project: ProjectNode = {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            taskIds: ['task-1', 'non-existent-task'],
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
            lamportTs: 2
        };

        initialState.projects.set('project-1', project);
        initialState.tasks.set('task-1', task);

        const tasks = getTasksForProject(initialState, 'project-1');

        expect(tasks).toHaveLength(1);
        expect(tasks[0]).toEqual(task);
    });
}); 