import React, { useState, useEffect, useRef, useReducer } from 'react';
import { Box, Grid, Alert, Typography, Button } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import ProjectsSection from './ProjectsSection';
import TasksSection from './TasksSection';
import ProjectDialog from './ProjectDialog';
import TaskDialog from './TaskDialog';
import { useWebSocket } from '../../hooks/useWebSocket';
import { ProjectNode, TaskNode, EventNode } from '../../../shared/types';
import { projectsReducer } from './reducers';

const ProjectManagement: React.FC = () => {
    const [projects, dispatch] = useReducer(projectsReducer, []);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [projectDialogOpen, setProjectDialogOpen] = useState(false);
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectNode | null>(null);
    const [editingTask, setEditingTask] = useState<TaskNode | null>(null);
    
    // Granular loading states
    const [loadingProjects, setLoadingProjects] = useState<Set<string>>(new Set());
    const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());
    
    // Derive selectedProject from projects array
    const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) || null : null;

    // WebSocket connection
    const wsUrl = `ws://${window.location.hostname}:8080`;
    const { isConnected, eventQueue, clearEventQueue, sendEvent, lamportCounter, clientId } = useWebSocket(wsUrl);

    // Notify TasksPage when dialog states change
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('dialog-state-changed', {
            detail: { projectDialogOpen, taskDialogOpen }
        }));
    }, [projectDialogOpen, taskDialogOpen]);

    // Listen for global unfocus event
    useEffect(() => {
        const handleUnfocusProject = () => {
            // Don't unfocus if dialogs are open
            if (projectDialogOpen || taskDialogOpen) {
                return;
            }
            setSelectedProjectId(null);
        };

        window.addEventListener('unfocus-project', handleUnfocusProject);

        return () => {
            window.removeEventListener('unfocus-project', handleUnfocusProject);
        };
    }, [projectDialogOpen, taskDialogOpen]);

    // Handle WebSocket events with reducer
    React.useEffect(() => {
        if (eventQueue.length > 0) {
            console.log(`ProjectManagement processing ${eventQueue.length} WebSocket events`);
            console.log('Current projects state before processing:', projects);
            
            eventQueue.forEach((event: EventNode, index: number) => {
                console.log(`Processing event ${index + 1}/${eventQueue.length}:`, event);
                
                try {
                    switch (event.action) {
                        case 'create':
                            console.log('✅ Processing CREATE event:', event.nodeType, event.nodeId, 'Lamport:', event.lamportTs);
                            if (event.nodeType === 'project') {
                                dispatch({
                                    type: 'CREATE_PROJECT',
                                    payload: { project: event.data as ProjectNode, lamportTs: event.lamportTs }
                                });
                            } else if (event.nodeType === 'task') {
                                dispatch({
                                    type: 'CREATE_TASK',
                                    payload: { task: event.data as TaskNode, lamportTs: event.lamportTs }
                                });
                            } else {
                                console.warn('⚠️ Unknown node type for create event:', event.nodeType);
                                setError(`Unknown node type for create event: ${event.nodeType}`);
                            }
                            break;
                            
                        case 'update':
                            console.log('✅ Processing UPDATE event:', event.nodeType, event.nodeId, 'Lamport:', event.lamportTs);
                            if (event.nodeType === 'project') {
                                dispatch({
                                    type: 'UPDATE_PROJECT',
                                    payload: { projectId: event.nodeId, project: event.data as ProjectNode, lamportTs: event.lamportTs }
                                });
                            } else if (event.nodeType === 'task') {
                                dispatch({
                                    type: 'UPDATE_TASK',
                                    payload: { taskId: event.nodeId, task: event.data as TaskNode, lamportTs: event.lamportTs }
                                });
                            } else {
                                console.warn('⚠️ Unknown node type for update event:', event.nodeType);
                                setError(`Unknown node type for update event: ${event.nodeType}`);
                            }
                            break;
                            
                        case 'delete':
                            console.log('✅ Processing DELETE event:', event.nodeType, event.nodeId, 'Lamport:', event.lamportTs);
                            if (event.nodeType === 'project') {
                                dispatch({
                                    type: 'DELETE_PROJECT',
                                    payload: { projectId: event.nodeId, lamportTs: event.lamportTs }
                                });
                            } else if (event.nodeType === 'task') {
                                dispatch({
                                    type: 'DELETE_TASK',
                                    payload: { taskId: event.nodeId, lamportTs: event.lamportTs }
                                });
                            } else {
                                console.warn('⚠️ Unknown node type for delete event:', event.nodeType);
                                setError(`Unknown node type for delete event: ${event.nodeType}`);
                            }
                            break;
                            
                        default:
                            console.warn('⚠️ Unknown event action:', event.action);
                            setError(`Unknown event action: ${event.action}`);
                            break;
                    }
                } catch (err) {
                    console.error('❌ Error processing WebSocket event:', err);
                    setError(`Error processing event: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
            });
            
            console.log('Final projects state:', projects);
        }
        
        // Cleanup function runs after each render and before the next effect
        return () => {
            if (eventQueue.length > 0) {
                console.log('🧹 Clearing event queue in useEffect cleanup');
                clearEventQueue();
            }
        };
    }, [eventQueue, clearEventQueue]);

    // Handle selected project cleanup when projects are deleted
    React.useEffect(() => {
        if (selectedProjectId && !projects.find(p => p.id === selectedProjectId)) {
            console.log('🗑️ Clearing selected project - project was deleted');
            setSelectedProjectId(null);
        }
    }, [projects, selectedProjectId]);

    // Mock handlers for project management
    const openProjectDialog = (project?: ProjectNode) => {
        setEditingProject(project || null);
        setProjectDialogOpen(true);
    };

    const openTaskDialog = (task?: TaskNode) => {
        setEditingTask(task || null);
        setTaskDialogOpen(true);
    };

    const handleProjectSubmit = (formData: Partial<ProjectNode> & { lamportTs?: number }) => {
        try {
            // Clear any previous errors
            setError(null);
            
            if (editingProject) {
                // Update existing project
                setLoadingProjects(prev => new Set(prev).add(editingProject.id));
                const updatedProject: ProjectNode = { 
                    ...editingProject, 
                    ...formData, 
                    updatedAt: new Date().toISOString(),
                    lamportTs: formData.lamportTs || lamportCounter 
                };
                dispatch({
                    type: 'UPDATE_PROJECT',
                    payload: { projectId: editingProject.id, project: updatedProject, lamportTs: formData.lamportTs || lamportCounter, isLocal: true }
                });
                
                // Send update event
                sendEvent('update', 'project', updatedProject.id, updatedProject);
                
                // Clear loading after a short delay
                setTimeout(() => {
                    setLoadingProjects(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(editingProject.id);
                        return newSet;
                    });
                }, 500);
            } else {
                // Create new project
                const newProject: ProjectNode = {
                    id: uuidv4(),
                    name: formData.name || '',
                    description: formData.description || '',
                    tasks: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lamportTs: formData.lamportTs || lamportCounter
                };
                dispatch({
                    type: 'CREATE_PROJECT',
                    payload: { project: newProject, lamportTs: formData.lamportTs || lamportCounter, isLocal: true }
                });
                
                // Send create event
                sendEvent('create', 'project', newProject.id, newProject);
            }
            // Add a small delay before closing dialog to prevent click-outside interference
            setTimeout(() => {
                setProjectDialogOpen(false);
                setEditingProject(null);
            }, 100);
        } catch (err) {
            console.error('❌ Error in project submit:', err);
            setError(`Error saving project: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleTaskSubmit = (formData: Partial<TaskNode> & { lamportTs?: number }) => {
        try {
            // Clear any previous errors
            setError(null);
            
            if (editingTask) {
                // Update existing task
                setLoadingTasks(prev => new Set(prev).add(editingTask.id));
                const updatedTask: TaskNode = { 
                    ...editingTask, 
                    ...formData, 
                    updatedAt: new Date().toISOString(),
                    lamportTs: formData.lamportTs || lamportCounter 
                };
                dispatch({
                    type: 'UPDATE_TASK',
                    payload: { taskId: editingTask.id, task: updatedTask, lamportTs: formData.lamportTs || lamportCounter, isLocal: true }
                });
                
                // No need to update selectedProject since it's derived from projects array
                
                // Send update event
                sendEvent('update', 'task', updatedTask.id, updatedTask);
                
                // Clear loading after a short delay
                setTimeout(() => {
                    setLoadingTasks(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(editingTask.id);
                        return newSet;
                    });
                }, 500);
            } else {
                // Create new task
                const newTask: TaskNode = {
                    id: uuidv4(),
                    projectId: selectedProject?.id || '',
                    title: formData.title || '',
                    status: formData.status || 'pending',
                    configuration: {
                        priority: formData.configuration?.priority || 1,
                        description: formData.configuration?.description || ''
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lamportTs: formData.lamportTs || lamportCounter
                };
                dispatch({
                    type: 'CREATE_TASK',
                    payload: { task: newTask, lamportTs: formData.lamportTs || lamportCounter, isLocal: true }
                });
                
                // No need to update selectedProject since it's derived from projects array
                
                // Send create event
                sendEvent('create', 'task', newTask.id, newTask);
            }
            // Add a small delay before closing dialog to prevent click-outside interference
            setTimeout(() => {
                setTaskDialogOpen(false);
                setEditingTask(null);
            }, 100);
        } catch (err) {
            console.error('❌ Error in task submit:', err);
            setError(`Error saving task: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDeleteProject = (projectId: string) => {
        try {
            // Clear any previous errors
            setError(null);
            
            const projectToDelete = projects.find(p => p.id === projectId);
            
            // Check if we're deleting the currently selected project
            const isDeletingSelectedProject = selectedProjectId === projectId;
            
            // Add a small delay to prevent click-outside interference
            setTimeout(() => {
                // Update local state immediately for UI feedback
                dispatch({
                    type: 'DELETE_PROJECT',
                    payload: { projectId: projectId, lamportTs: lamportCounter, isLocal: true }
                });
                
                // Only unfocus if we're deleting the selected project
                if (isDeletingSelectedProject) {
                    setSelectedProjectId(null);
                }
                
                // Send delete event to server
                if (projectToDelete) {
                    sendEvent('delete', 'project', projectToDelete.id, projectToDelete);
                }
            }, 50);
        } catch (err) {
            console.error('❌ Error deleting project:', err);
            setError(`Error deleting project: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDeleteTask = (taskId: string) => {
        try {
            // Clear any previous errors
            setError(null);
            
            const taskToDelete = selectedProject?.tasks.find(t => t.id === taskId);
            
            // Add a small delay to prevent click-outside interference
            setTimeout(() => {
                // Update local state immediately for UI feedback
                dispatch({
                    type: 'DELETE_TASK',
                    payload: { taskId: taskId, lamportTs: lamportCounter, isLocal: true }
                });
                
                // Send delete event to server
                if (taskToDelete) {
                    sendEvent('delete', 'task', taskToDelete.id, taskToDelete);
                }
            }, 50);
        } catch (err) {
            console.error('❌ Error deleting task:', err);
            setError(`Error deleting task: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    return (
        <Box 
            sx={{ width: '100%' }}
        >
            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 2 }}
                    onClose={() => setError(null)}
                    action={
                        <Button color="inherit" size="small" onClick={() => setError(null)}>
                            Dismiss
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {/* WebSocket Status */}
            <Alert 
                severity={isConnected ? "success" : "warning"} 
                sx={{ mb: 2 }}
            >
                WebSocket: {isConnected ? "Connected" : "Disconnected"} | 
                Lamport Counter: {lamportCounter} | 
                Client ID: {clientId}
            </Alert>

            {/* Connection Info */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                WebSocket URL: {wsUrl}
            </Typography>

            {/* Test Error Buttons - Remove in production */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button 
                    variant="outlined" 
                    color="warning" 
                    size="small"
                    onClick={() => setError('Test error message - this is a sample error for testing')}
                >
                    Test Error Alert
                </Button>
                <Button 
                    variant="outlined" 
                    color="warning" 
                    size="small"
                    onClick={() => {
                        try {
                            // Simulate a WebSocket error
                            const invalidEvent = {
                                action: 'invalid_action',
                                nodeType: 'unknown_type',
                                nodeId: 'test-id',
                                lamportTs: 1,
                                data: null
                            };
                            // This will trigger the default case in our switch statement
                            console.log('Triggering invalid event:', invalidEvent);
                            setError('Invalid event action: invalid_action');
                        } catch (err) {
                            setError(`Test error: ${err instanceof Error ? err.message : 'Unknown error'}`);
                        }
                    }}
                >
                    Test Invalid Event
                </Button>
                <Button 
                    variant="outlined" 
                    color="warning" 
                    size="small"
                    onClick={() => {
                        try {
                            // Simulate a reducer error with invalid payload
                            dispatch({
                                type: 'UPDATE_PROJECT',
                                payload: { 
                                    projectId: 'invalid-project',
                                    // Missing project and lamportTs
                                } as any
                            });
                        } catch (err) {
                            setError(`Reducer error: ${err instanceof Error ? err.message : 'Unknown error'}`);
                        }
                    }}
                >
                    Test Invalid Payload
                </Button>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <ProjectsSection
                        projects={projects}
                        selectedProject={selectedProject}
                        loading={loading}
                        loadingProjects={loadingProjects}
                        onProjectSelect={(project) => setSelectedProjectId(project?.id || null)}
                        onProjectEdit={openProjectDialog}
                        onProjectDelete={handleDeleteProject}
                        onProjectCreate={() => openProjectDialog()}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TasksSection
                        selectedProject={selectedProject}
                        loading={loading}
                        loadingTasks={loadingTasks}
                        onTaskEdit={openTaskDialog}
                        onTaskDelete={handleDeleteTask}
                        onTaskCreate={() => openTaskDialog()}
                    />
                </Grid>
            </Grid>

            {/* Dialogs */}
            <ProjectDialog
                open={projectDialogOpen}
                project={editingProject || undefined}
                onClose={() => setProjectDialogOpen(false)}
                onSubmit={handleProjectSubmit}
                loading={false}
            />

            <TaskDialog
                open={taskDialogOpen}
                task={editingTask ?? undefined}
                projectId={selectedProject?.id || ''}
                onClose={() => setTaskDialogOpen(false)}
                onSubmit={handleTaskSubmit}
                loading={false}
            />
        </Box>
    );
};

export default ProjectManagement; 