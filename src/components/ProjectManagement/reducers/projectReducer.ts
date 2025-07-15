import { ProjectNode, TaskNode } from '../../../../shared/types';

// Action types for the reducer
export type ProjectAction =
    | { type: 'CREATE_PROJECT'; payload: { project: ProjectNode; lamportTs: number; isLocal?: boolean } }
    | { type: 'UPDATE_PROJECT'; payload: { projectId: string; project: ProjectNode; lamportTs: number; isLocal?: boolean } }
    | { type: 'DELETE_PROJECT'; payload: { projectId: string; lamportTs: number; isLocal?: boolean } }
    | { type: 'CREATE_TASK'; payload: { task: TaskNode; lamportTs: number; isLocal?: boolean } }
    | { type: 'UPDATE_TASK'; payload: { taskId: string; task: TaskNode; lamportTs: number; isLocal?: boolean } }
    | { type: 'DELETE_TASK'; payload: { taskId: string; lamportTs: number; isLocal?: boolean } };

// Reducer function to handle project state updates
export const projectsReducer = (state: ProjectNode[], action: ProjectAction): ProjectNode[] => {
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

            const existingProject = state.find(p => p.id === project.id);

            if (!existingProject) {
                // Create new project
                console.log('➕ Creating new project:', project.id, isLocal ? '(local)' : '(remote)');
                return [...state, { ...project, lamportTs }];
            } else {
                if (isLocal) {
                    // For local operations, always apply immediately
                    console.log('🔄 Replacing project (local create):', project.id);
                    return state.map(p => p.id === project.id ? { ...project, lamportTs } : p);
                } else {
                    // For remote operations, use LWW logic
                    const existingTs = existingProject.lamportTs || 0;
                    if (lamportTs > existingTs || (lamportTs === existingTs && project.id > existingProject.id)) {
                        console.log('🔄 Replacing project (remote create):', project.id, lamportTs === existingTs ? '(UUID tiebreaker)' : '');
                        return state.map(p => p.id === project.id ? { ...project, lamportTs } : p);
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

            return state.map(p => {
                if (p.id === projectId) {
                    if (isLocal) {
                        // For local operations, always apply immediately
                        console.log('🔄 Updating project (local):', projectId);
                        return { ...project, lamportTs };
                    } else {
                        // For remote operations, use LWW logic
                        const existingTs = p.lamportTs || 0;
                        if (lamportTs > existingTs || (lamportTs === existingTs && project.id > p.id)) {
                            console.log('🔄 Updating project (remote):', projectId, lamportTs === existingTs ? '(UUID tiebreaker)' : '');
                            return { ...project, lamportTs };
                        } else {
                            console.log('⏭️ Skipping project update - older or same timestamp with smaller UUID');
                            return p;
                        }
                    }
                }
                return p;
            });
        }

        case 'DELETE_PROJECT': {
            const { projectId, lamportTs, isLocal = false } = action.payload;

            // Validate required fields
            if (!projectId || typeof lamportTs !== 'number') {
                console.warn('⚠️ Invalid DELETE_PROJECT payload:', action.payload);
                return state;
            }

            return state.filter(p => {
                if (p.id === projectId) {
                    if (isLocal) {
                        // For local operations, always apply immediately
                        console.log('🗑️ Deleting project (local):', p.id);
                        return false;
                    } else {
                        // For remote operations, use LWW logic
                        const existingTs = p.lamportTs || 0;
                        if (lamportTs > existingTs || (lamportTs === existingTs && projectId > p.id)) {
                            console.log('🗑️ Deleting project (remote):', p.id, lamportTs === existingTs ? '(UUID tiebreaker)' : '');
                            return false;
                        } else {
                            console.log('⏭️ Skipping project delete - older or same timestamp with smaller UUID');
                            return true;
                        }
                    }
                }
                return true;
            });
        }

        case 'CREATE_TASK': {
            const { task, lamportTs, isLocal = false } = action.payload;

            // Validate required fields
            if (!task || !task.id || !task.projectId || typeof lamportTs !== 'number') {
                console.warn('⚠️ Invalid CREATE_TASK payload:', action.payload);
                return state;
            }

            return state.map(p => {
                if (p.id === task.projectId) {
                    const existingTask = p.tasks.find(t => t.id === task.id);
                    if (!existingTask) {
                        console.log('➕ Creating new task:', task.id, isLocal ? '(local)' : '(remote)');
                        return {
                            ...p,
                            tasks: [...p.tasks, { ...task, lamportTs }],
                            updatedAt: new Date().toISOString()
                        };
                    } else {
                        if (isLocal) {
                            // For local operations, always apply immediately
                            console.log('🔄 Replacing task (local create):', task.id);
                            return {
                                ...p,
                                tasks: p.tasks.map(t => t.id === task.id ? { ...task, lamportTs } : t),
                                updatedAt: new Date().toISOString()
                            };
                        } else {
                            // For remote operations, use LWW logic
                            const existingTs = existingTask.lamportTs || 0;
                            if (lamportTs > existingTs || (lamportTs === existingTs && task.id > existingTask.id)) {
                                console.log('🔄 Replacing task (remote create):', task.id, lamportTs === existingTs ? '(UUID tiebreaker)' : '');
                                return {
                                    ...p,
                                    tasks: p.tasks.map(t => t.id === task.id ? { ...task, lamportTs } : t),
                                    updatedAt: new Date().toISOString()
                                };
                            } else {
                                console.log('⏭️ Skipping task create - older or same timestamp with smaller UUID');
                                return p;
                            }
                        }
                    }
                }
                return p;
            });
        }

        case 'UPDATE_TASK': {
            const { taskId, task, lamportTs, isLocal = false } = action.payload;

            // Validate required fields
            if (!taskId || !task || typeof lamportTs !== 'number') {
                console.warn('⚠️ Invalid UPDATE_TASK payload:', action.payload);
                return state;
            }

            return state.map(p => {
                return {
                    ...p,
                    tasks: p.tasks.map(t => {
                        if (t.id === taskId) {
                            if (isLocal) {
                                // For local operations, always apply immediately
                                console.log('🔄 Updating task (local):', taskId);
                                return { ...task, lamportTs };
                            } else {
                                // For remote operations, use LWW logic
                                const existingTs = t.lamportTs || 0;
                                if (lamportTs > existingTs || (lamportTs === existingTs && task.id > t.id)) {
                                    console.log('🔄 Updating task (remote):', taskId, lamportTs === existingTs ? '(UUID tiebreaker)' : '');
                                    return { ...task, lamportTs };
                                } else {
                                    console.log('⏭️ Skipping task update - older or same timestamp with smaller UUID');
                                    return t;
                                }
                            }
                        }
                        return t;
                    }),
                    updatedAt: new Date().toISOString()
                };
            });
        }

        case 'DELETE_TASK': {
            const { taskId, lamportTs, isLocal = false } = action.payload;

            // Validate required fields
            if (!taskId || typeof lamportTs !== 'number') {
                console.warn('⚠️ Invalid DELETE_TASK payload:', action.payload);
                return state;
            }

            return state.map(p => {
                return {
                    ...p,
                    tasks: p.tasks.filter(t => {
                        if (t.id === taskId) {
                            if (isLocal) {
                                // For local operations, always apply immediately
                                console.log('🗑️ Deleting task (local):', t.id);
                                return false;
                            } else {
                                // For remote operations, use LWW logic
                                const existingTs = t.lamportTs || 0;
                                if (lamportTs > existingTs || (lamportTs === existingTs && taskId > t.id)) {
                                    console.log('🗑️ Deleting task (remote):', t.id, lamportTs === existingTs ? '(UUID tiebreaker)' : '');
                                    return false;
                                } else {
                                    console.log('⏭️ Skipping task delete - older or same timestamp with smaller UUID');
                                    return true;
                                }
                            }
                        }
                        return true;
                    }),
                    updatedAt: new Date().toISOString()
                };
            });
        }

        default:
            console.warn('⚠️ Unknown action type:', (action as any).type);
            return state;
    }
}; 