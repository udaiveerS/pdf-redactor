import React from 'react';
import { Paper, Typography, Box, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ProjectNode } from '../../../shared/types';
import { ProjectCardProps } from './types';

const ProjectCard: React.FC<ProjectCardProps> = ({ project, isSelected, onSelect, onEdit, onDelete }) => (
    <Paper
        onClick={() => onSelect(project)}
        sx={{
            mb: 3,
            cursor: 'pointer',
            p: 3,
            width: '100%',
            bgcolor: isSelected ? 'action.selected' : 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
            border: isSelected ? 2 : 1,
            borderColor: isSelected ? 'primary.main' : 'divider',
            transition: 'all 0.2s ease-in-out'
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="medium">
                    {project.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    {project.tasks?.length || 0} tasks
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {project.description}
                </Typography>
            </Box>
            <Box>
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(project);
                    }}
                    size="large"
                >
                    <EditIcon />
                </IconButton>
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(project.id);
                    }}
                    size="large"
                    color="error"
                >
                    <DeleteIcon />
                </IconButton>
            </Box>
        </Box>
    </Paper>
);

export default ProjectCard; 