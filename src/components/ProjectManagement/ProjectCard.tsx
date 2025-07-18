import React from 'react';
import { Paper, Typography, Box, IconButton, CircularProgress, Fade, Grow } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ProjectNode } from '../../../shared/types';
import { ProjectCardProps } from './types';

const ProjectCard: React.FC<ProjectCardProps> = ({ project, isSelected, isLoading, onSelect, onEdit, onDelete }) => (
    <Grow in={true} timeout={300}>
        <Paper
            onClick={() => onSelect(project)}
            sx={{
                mb: 3,
                cursor: 'pointer',
                p: 3,
                width: '100%',
                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                border: isSelected ? 2 : 1,
                borderColor: isSelected ? 'primary.main' : 'divider',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { 
                    bgcolor: isSelected ? 'action.selected' : 'action.hover',
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="medium">
                        {project.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                        {project.taskIds?.length || 0} tasks
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {project.description}
                    </Typography>
                </Box>
                <Box>
                    {isLoading ? (
                        <CircularProgress size={20} />
                    ) : (
                        <>
                            <Fade in={true} timeout={500}>
                                <IconButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(project);
                                    }}
                                    size="large"
                                >
                                    <EditIcon />
                                </IconButton>
                            </Fade>
                            <Fade in={true} timeout={700}>
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
                            </Fade>
                        </>
                    )}
                </Box>
            </Box>
        </Paper>
    </Grow>
);

export default ProjectCard; 