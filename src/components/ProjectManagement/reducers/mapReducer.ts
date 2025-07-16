import { ProjectNode, TaskNode, ID } from '../../../../shared/types';
import { StoreState } from './types';

// Action types for the Map-based reducer
export type MapAction =
    | { type: 'CREATE_PROJECT'; payload: { project: ProjectNode; lamportTs: number; isLocal?: boolean } }
    | { type: 'UPDATE_PROJECT'; payload: { projectId: string; project: ProjectNode; lamportTs: number; isLocal?: boolean } }
    | { type: 'DELETE_PROJECT'; payload: { projectId: string; lamportTs: number; isLocal?: boolean } }
    | { type: 'CREATE_TASK'; payload: { task: TaskNode; lamportTs: number; isLocal?: boolean } }
    | { type: 'UPDATE_TASK'; payload: { taskId: string; task: TaskNode; lamportTs: number; isLocal?: boolean } }
    | { type: 'DELETE_TASK'; payload: { taskId: string; lamportTs: number; isLocal?: boolean } };

// Map-based reducer function for O(1) lookups
export const mapReducer = (state: StoreState, action: MapAction): StoreState => {
    // Validate action payload
    if (!action.payload) {
        console.warn('⚠️ Invalid action payload: payload is null or undefined');
        return state;
    }

    switch (action.type) {
        case 'CREATE_PROJECT': {
            const { project, lamportTs, isLocal = false } = action.payload;

            // Validate required fields
            if (!project || !project.id || typeof lamportTs !== 'number') {
                console.warn('⚠️ Invalid CREATE_PROJECT payload:', action.payload);
                return state;
            }

            const existingProject = state.projects.get(project.id);

            if (!existingProject) {
                // Create new project
                console.log('➕ Creating new project:', project.id, isLocal ? '(local)' : '(remote)');
                const newProjects = new Map(state.projects);
                newProjects.set(project.id, {
                    ...project,
                    lamportTs,
                    taskIds: project.taskIds || []
                });
                return { ...state, projects: newProjects };
            } else {
                if (isLocal) {
                    // For local operations, always apply immediately
                    console.log('🔄 Replacing project (local create):', project.id);
                    const newProjects = new Map(state.projects);
                    newProjects.set(project.id, { ...project, lamportTs, taskIds: project.taskIds || [] });
                    return { ...state, projects: newProjects };
                } else {
                    // For remote operations, use LWW logic
                    const existingTs = existingProject.lamportTs || 0;
                    if (lamportTs > existingTs || (lamportTs === existingTs && project.id > existingProject.id)) {
                        console.log('🔄 Replacing project (remote create):', project.id, lamportTs === existingTs ? '(UUID tiebreaker)' : '');
                        const newProjects = new Map(state.projects);
                        newProjects.set(project.id, { ...project, lamportTs, taskIds: project.taskIds || [] });
                        return { ...state, projects: newProjects };
                    } else {
                        console.log('⏭️ Skipping project create - older or same timestamp with smaller UUID');
                        return state;
                    }
                }
            }
        }

        case 'UPDATE_PROJECT': {
            const { projectId, project, lamportTs, isLocal = false } = action.payload;

            // Validate required fields
            if (!projectId || !project || typeof lamportTs !== 'number') {
                console.warn('⚠️ Invalid UPDATE_PROJECT payload:', action.payload);
                return state;
            }

            const existingProject = state.projects.get(projectId);
            if (!existingProject) {
                console.warn('⚠️ Project not found for update:', projectId);
                return state;
            }

            if (isLocal) {
                // For local operations, always apply immediately
                console.log('🔄 Updating project (local):', projectId);
                const newProjects = new Map(state.projects);
                newProjects.set(projectId, { ...project, lamportTs, taskIds: project.taskIds || existingProject.taskIds });
                return { ...state, projects: newProjects };
            } else {
                // For remote operations, use LWW logic
                const existingTs = existingProject.lamportTs || 0;
                if (lamportTs > existingTs || (lamportTs === existingTs && project.id > existingProject.id)) {
                    console.log('🔄 Updating project (remote):', projectId, lamportTs === existingTs ? '(UUID tiebreaker)' : '');
                    const newProjects = new Map(state.projects);
                    newProjects.set(projectId, { ...project, lamportTs, taskIds: project.taskIds || existingProject.taskIds });
                    return { ...state, projects: newProjects };
                } else {
                    console.log('⏭️ Skipping project update - older or same timestamp with smaller UUID');
                    return state;
                }
            }
        }

        case 'DELETE_PROJECT': {
            const { projectId, lamportTs, isLocal = false } = action.payload;

            // Validate required fields
            if (!projectId || typeof lamportTs !== 'number') {
                console.warn('⚠️ Invalid DELETE_PROJECT payload:', action.payload);
                return state;
            }

            const existingProject = state.projects.get(projectId);
            if (!existingProject) {
                return state;
            }

            if (isLocal) {
                // For local operations, always apply immediately
                console.log('🗑️ Deleting project (local):', projectId);
                const newProjects = new Map(state.projects);
                newProjects.delete(projectId);
                return { ...state, projects: newProjects };
            } else {
                // For remote operations, use LWW logic
                const existingTs = existingProject.lamportTs || 0;
                if (lamportTs > existingTs || (lamportTs === existingTs && projectId > existingProject.id)) {
                    console.log('🗑️ Deleting project (remote):', projectId, lamportTs === existingTs ? '(UUID tiebreaker)' : '');
                    const newProjects = new Map(state.projects);
                    newProjects.delete(projectId);
                    return { ...state, projects: newProjects };
                } else {
                    console.log('⏭️ Skipping project delete - older or same timestamp with smaller UUID');
                    return state;
                }
            }
        }

        case 'CREATE_TASK': {
            const { task, lamportTs, isLocal = false } = action.payload;

            // Validate required fields
            if (!task || !task.id || !task.projectId || typeof lamportTs !== 'number') {
                console.warn('⚠️ Invalid CREATE_TASK payload:', action.payload);
                return state;
            }

            const project = state.projects.get(task.projectId);
            if (!project) {
                console.warn('⚠️ Project not found for task creation:', task.projectId);
                return state;
            }

            const existingTask = state.tasks.get(task.id);
            if (!existingTask) {
                console.log('➕ Creating new task:', task.id, isLocal ? '(local)' : '(remote)');

                // Add task to tasks map
                const newTasks = new Map(state.tasks);
                newTasks.set(task.id, { ...task, lamportTs });

                // Add task ID to project's taskIds (only if not already present)
                const newProjects = new Map(state.projects);
                const updatedProject = {
                    ...project,
                    taskIds: project.taskIds?.includes(task.id)
                        ? project.taskIds
                        : [...(project.taskIds || []), task.id],
                    updatedAt: new Date().toISOString()
                };
                newProjects.set(task.projectId, updatedProject);

                return { ...state, projects: newProjects, tasks: newTasks };
            } else {
                if (isLocal) {
                    // For local operations, always apply immediately
                    console.log('🔄 Replacing task (local create):', task.id);
                    const newTasks = new Map(state.tasks);
                    newTasks.set(task.id, { ...task, lamportTs });

                    // Ensure task ID is in project's taskIds (only if not already present)
                    const newProjects = new Map(state.projects);
                    const updatedProject = {
                        ...project,
                        taskIds: project.taskIds?.includes(task.id)
                            ? project.taskIds
                            : [...(project.taskIds || []), task.id],
                        updatedAt: new Date().toISOString()
                    };
                    newProjects.set(task.projectId, updatedProject);

                    return { ...state, projects: newProjects, tasks: newTasks };
                } else {
                    // For remote operations, use LWW logic
                    const existingTs = existingTask.lamportTs || 0;
                    if (lamportTs > existingTs || (lamportTs === existingTs && task.id > existingTask.id)) {
                        console.log('🔄 Replacing task (remote create):', task.id, lamportTs === existingTs ? '(UUID tiebreaker)' : '');
                        const newTasks = new Map(state.tasks);
                        newTasks.set(task.id, { ...task, lamportTs });

                        // Ensure task ID is in project's taskIds (only if not already present)
                        const newProjects = new Map(state.projects);
                        const updatedProject = {
                            ...project,
                            taskIds: project.taskIds?.includes(task.id)
                                ? project.taskIds
                                : [...(project.taskIds || []), task.id],
                            updatedAt: new Date().toISOString()
                        };
                        newProjects.set(task.projectId, updatedProject);

                        return { ...state, projects: newProjects, tasks: newTasks };
                    } else {
                        console.log('⏭️ Skipping task create - older or same timestamp with smaller UUID');
                        return state;
                    }
                }
            }
        }

        case 'UPDATE_TASK': {
            const { taskId, task, lamportTs, isLocal = false } = action.payload;

            // Validate required fields
            if (!taskId || !task || typeof lamportTs !== 'number') {
                console.warn('⚠️ Invalid UPDATE_TASK payload:', action.payload);
                return state;
            }

            const existingTask = state.tasks.get(taskId);
            if (!existingTask) {
                console.warn('⚠️ Task not found for update:', taskId);
                return state;
            }

            if (isLocal) {
                // For local operations, always apply immediately
                console.log('🔄 Updating task (local):', taskId);
                const newTasks = new Map(state.tasks);
                newTasks.set(taskId, { ...task, lamportTs });
                return { ...state, tasks: newTasks };
            } else {
                // For remote operations, use LWW logic
                const existingTs = existingTask.lamportTs || 0;
                if (lamportTs > existingTs || (lamportTs === existingTs && task.id > existingTask.id)) {
                    console.log('🔄 Updating task (remote):', taskId, lamportTs === existingTs ? '(UUID tiebreaker)' : '');
                    const newTasks = new Map(state.tasks);
                    newTasks.set(taskId, { ...task, lamportTs });
                    return { ...state, tasks: newTasks };
                } else {
                    console.log('⏭️ Skipping task update - older or same timestamp with smaller UUID');
                    return state;
                }
            }
        }

        case 'DELETE_TASK': {
            const { taskId, lamportTs, isLocal = false } = action.payload;

            // Validate required fields
            if (!taskId || typeof lamportTs !== 'number') {
                console.warn('⚠️ Invalid DELETE_TASK payload:', action.payload);
                return state;
            }

            const existingTask = state.tasks.get(taskId);
            if (!existingTask) {
                return state;
            }

            if (isLocal) {
                // For local operations, always apply immediately
                console.log('🗑️ Deleting task (local):', taskId);

                // Remove task from tasks map
                const newTasks = new Map(state.tasks);
                newTasks.delete(taskId);

                // Remove task ID from project's taskIds
                const project = state.projects.get(existingTask.projectId);
                if (project) {
                    const newProjects = new Map(state.projects);
                    const updatedProject = {
                        ...project,
                        taskIds: (project.taskIds || []).filter(id => id !== taskId),
                        updatedAt: new Date().toISOString()
                    };
                    newProjects.set(existingTask.projectId, updatedProject);
                    return { ...state, projects: newProjects, tasks: newTasks };
                }

                return { ...state, tasks: newTasks };
            } else {
                // For remote operations, use LWW logic
                const existingTs = existingTask.lamportTs || 0;
                if (lamportTs > existingTs || (lamportTs === existingTs && taskId > existingTask.id)) {
                    console.log('🗑️ Deleting task (remote):', taskId, lamportTs === existingTs ? '(UUID tiebreaker)' : '');

                    // Remove task from tasks map
                    const newTasks = new Map(state.tasks);
                    newTasks.delete(taskId);

                    // Remove task ID from project's taskIds
                    const project = state.projects.get(existingTask.projectId);
                    if (project) {
                        const newProjects = new Map(state.projects);
                        const updatedProject = {
                            ...project,
                            taskIds: (project.taskIds || []).filter(id => id !== taskId),
                            updatedAt: new Date().toISOString()
                        };
                        newProjects.set(existingTask.projectId, updatedProject);
                        return { ...state, projects: newProjects, tasks: newTasks };
                    }

                    return { ...state, tasks: newTasks };
                } else {
                    console.log('⏭️ Skipping task delete - older or same timestamp with smaller UUID');
                    return state;
                }
            }
        }

        default:
            console.warn('⚠️ Unknown action type:', (action as any).type);
            return state;
    }
}; 