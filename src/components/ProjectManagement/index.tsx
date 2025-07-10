import React from 'react';
import { Box, Grid, Alert } from '@mui/material';
import ProjectsSection from './ProjectsSection';
import TasksSection from './TasksSection';
import ProjectDialog from './ProjectDialog';
import TaskDialog from './TaskDialog';
import { useProjectManagement } from './hooks';

const ProjectManagement: React.FC = () => {
    const {
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
    } = useProjectManagement();

    return (
        <Box sx={{ width: '100%' }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={2} columns={12}>
                {/* Left Side - Projects */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <ProjectsSection
                        projects={projects}
                        selectedProject={selectedProject}
                        loading={loading}
                        onProjectSelect={setSelectedProject}
                        onProjectEdit={openProjectDialog}
                        onProjectDelete={handleDeleteProject}
                        onProjectCreate={() => openProjectDialog()}
                    />
                </Grid>

                {/* Right Side - Tasks */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TasksSection
                        selectedProject={selectedProject}
                        loading={loading}
                        onTaskEdit={openTaskDialog}
                        onTaskDelete={handleDeleteTask}
                        onTaskCreate={() => openTaskDialog()}
                    />
                </Grid>
            </Grid>

            {/* Dialogs */}
            <ProjectDialog
                open={projectDialogOpen}
                project={editingProject}
                onClose={() => setProjectDialogOpen(false)}
                onSubmit={handleProjectSubmit}
                loading={loading}
            />

            <TaskDialog
                open={taskDialogOpen}
                task={editingTask}
                projectId={selectedProject?.id || ''}
                onClose={() => setTaskDialogOpen(false)}
                onSubmit={handleTaskSubmit}
                loading={loading}
            />
        </Box>
    );
};

export default ProjectManagement; 