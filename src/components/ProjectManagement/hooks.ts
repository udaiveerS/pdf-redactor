import { useState, useEffect } from 'react';
import { ProjectNode, TaskNode } from '../../../shared/types';

export const useProjectManagement = () => {
    const [projects, setProjects] = useState<ProjectNode[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectNode | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [projectDialogOpen, setProjectDialogOpen] = useState(false);
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectNode | undefined>();
    const [editingTask, setEditingTask] = useState<TaskNode | undefined>();

    // API Functions
    const loadProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8080/api/projects');
            if (!response.ok) throw new Error('Failed to load projects');
            const data = await response.json();
            setProjects(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (projectData: Partial<ProjectNode>) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8080/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });
            if (!response.ok) throw new Error('Failed to create project');
            await loadProjects();
            setProjectDialogOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProject = async (projectData: Partial<ProjectNode>) => {
        if (!editingProject) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/projects/${editingProject.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });
            if (!response.ok) throw new Error('Failed to update project');
            await loadProjects();
            setProjectDialogOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update project');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/projects/${projectId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete project');
            if (selectedProject?.id === projectId) {
                setSelectedProject(null);
            }
            await loadProjects();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete project');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (taskData: Partial<TaskNode>) => {
        if (!selectedProject) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/projects/${selectedProject.id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
            if (!response.ok) throw new Error('Failed to create task');
            await loadProjects();
            setTaskDialogOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTask = async (taskData: Partial<TaskNode>) => {
        if (!editingTask || !selectedProject) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/projects/${selectedProject.id}/tasks/${editingTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
            if (!response.ok) throw new Error('Failed to update task');
            await loadProjects();
            setTaskDialogOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update task');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!selectedProject || !confirm('Are you sure you want to delete this task?')) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/projects/${selectedProject.id}/tasks/${taskId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete task');
            await loadProjects();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete task');
        } finally {
            setLoading(false);
        }
    };

    // Dialog handlers
    const openProjectDialog = (project?: ProjectNode) => {
        setEditingProject(project);
        setProjectDialogOpen(true);
    };

    const openTaskDialog = (task?: TaskNode) => {
        setEditingTask(task);
        setTaskDialogOpen(true);
    };

    const handleProjectSubmit = (projectData: Partial<ProjectNode>) => {
        if (editingProject) {
            handleUpdateProject(projectData);
        } else {
            handleCreateProject(projectData);
        }
    };

    const handleTaskSubmit = (taskData: Partial<TaskNode>) => {
        if (editingTask) {
            handleUpdateTask(taskData);
        } else {
            handleCreateTask(taskData);
        }
    };

    // Load projects on component mount
    useEffect(() => {
        loadProjects();
    }, []);

    return {
        // State
        projects,
        selectedProject,
        loading,
        error,
        projectDialogOpen,
        taskDialogOpen,
        editingProject,
        editingTask,

        // Actions
        setSelectedProject,
        setProjectDialogOpen,
        setTaskDialogOpen,
        openProjectDialog,
        openTaskDialog,
        handleProjectSubmit,
        handleTaskSubmit,
        handleDeleteProject,
        handleDeleteTask
    };
}; 