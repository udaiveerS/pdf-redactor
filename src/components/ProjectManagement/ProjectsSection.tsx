import React from 'react';
import { Paper, Typography, Box, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { ProjectNode } from '../../../shared/types';
import { ProjectsSectionProps } from './types';
import ProjectCard from './ProjectCard';

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ 
    projects, 
    selectedProject, 
    loading, 
    onProjectSelect, 
    onProjectEdit, 
    onProjectDelete, 
    onProjectCreate 
}) => (
    <Paper sx={{ p: 4, minHeight: '80vh', overflow: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h5" fontWeight="medium">
                Projects
            </Typography>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onProjectCreate}
                disabled={loading}
                size="large"
            >
                New Project
            </Button>
        </Box>

        {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        ) : (
            <Box sx={{ width: '100%' }}>
                {projects && projects.length > 0 ? (
                    projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            isSelected={selectedProject?.id === project.id}
                            onSelect={onProjectSelect}
                            onEdit={onProjectEdit}
                            onDelete={onProjectDelete}
                        />
                    ))
                ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', p: 4 }}>
                        No projects yet. Create your first project!
                    </Typography>
                )}
            </Box>
        )}
    </Paper>
);

export default ProjectsSection; 