import React from 'react';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { ProjectNode } from '../../../shared/types';
import { TasksSectionProps } from './types';
import TaskCard from './TaskCard';

const TasksSection: React.FC<TasksSectionProps> = ({ 
    selectedProject, 
    loading, 
    onTaskEdit, 
    onTaskDelete, 
    onTaskCreate 
}) => (
    <Paper sx={{ p: 4, minHeight: '80vh', overflow: 'auto', width: '100%' }}>
        {selectedProject ? (
            <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box>
                        <Typography variant="h5" fontWeight="medium">
                            Tasks
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {selectedProject.name}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onTaskCreate}
                        disabled={loading}
                        size="large"
                    >
                        New Task
                    </Button>
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    {selectedProject.description}
                </Typography>

                {!selectedProject.tasks || selectedProject.tasks.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', p: 4 }}>
                        No tasks yet. Create your first task!
                    </Typography>
                ) : (
                    <Box sx={{ width: '100%' }}>
                        {selectedProject.tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={onTaskEdit}
                                onDelete={onTaskDelete}
                            />
                        ))}
                    </Box>
                )}
            </>
        ) : (
            <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" color="text.secondary">
                    Select a project to view tasks
                </Typography>
            </Box>
        )}
    </Paper>
);

export default TasksSection; 