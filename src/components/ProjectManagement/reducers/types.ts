import { ID, ProjectNode, TaskNode } from '../../../../shared/types';

// New Map-based state structure
export interface StoreState {
    projects: Map<ID, ProjectNode>;   // ProjectNode has taskIds: ID[]
    tasks: Map<ID, TaskNode>;
}

// Interface for project with populated tasks
export interface ProjectWithTasks extends ProjectNode {
    tasks: TaskNode[];
}

// Helper functions for working with the Map-based state
export const createInitialState = (): StoreState => ({
    projects: new Map(),
    tasks: new Map()
});

// Helper to get all projects as an array (for backward compatibility)
export const getProjectsArray = (state: StoreState): ProjectNode[] => {
    return Array.from(state.projects.values());
};

// Helper to get tasks for a specific project
export const getTasksForProject = (state: StoreState, projectId: ID): TaskNode[] => {
    const project = state.projects.get(projectId);
    if (!project) return [];

    return (project.taskIds || [])
        .map((taskId: ID) => state.tasks.get(taskId))
        .filter((task): task is TaskNode => task !== undefined);
};

// Helper to get a project with its tasks populated
export const getProjectWithTasks = (state: StoreState, projectId: ID): ProjectWithTasks | null => {
    const project = state.projects.get(projectId);
    if (!project) return null;

    const tasks = getTasksForProject(state, projectId);
    return {
        ...project,
        tasks
    };
};

// Helper to get all projects with their tasks populated
export const getProjectsWithTasks = (state: StoreState): ProjectWithTasks[] => {
    const projectsWithTasks = Array.from(state.projects.values()).map(project => {
        const tasks = getTasksForProject(state, project.id);
        console.log(`🔍 DEBUG: Project ${project.id} has ${tasks.length} tasks:`, tasks.map(t => ({ id: t.id, title: t.title })));
        return {
            ...project,
            tasks
        };
    });
    console.log('🔍 DEBUG: getProjectsWithTasks result:', projectsWithTasks.map(p => ({ id: p.id, taskCount: p.tasks.length, taskIds: p.taskIds })));
    return projectsWithTasks;
}; 