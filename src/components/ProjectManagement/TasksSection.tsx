import React from 'react';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { ProjectNode } from '../../../shared/types';
import { TasksSectionProps } from './types';
import TaskCard from './TaskCard';

const TasksSection: React.FC<TasksSectionProps> = ({ 
    selectedProject, 
    loading, 
    loadingTasks,
    onTaskEdit, 
    onTaskDelete, 
    onTaskCreate 
}) => (
    <Paper sx={{ p: 4, height: '70vh', display: 'flex', flexDirection: 'column' }}>
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
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', p: 4, flex: 1 }}>
                        No tasks yet. Create your first task!
                    </Typography>
                ) : (
                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                        {selectedProject.tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                isLoading={loadingTasks.has(task.id)}
                                onEdit={onTaskEdit}
                                onDelete={onTaskDelete}
                            />
                        ))}
                    </Box>
                )}
            </>
        ) : (
            <Box sx={{ textAlign: 'center', p: 4, flex: 1 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    Select a project to view tasks
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Click on a project in the left panel to view and manage its tasks.
                    <br />
                    Click outside the project list or tasks to unfocus the current project.
                </Typography>
            </Box>
        )}
    </Paper>
);

export default TasksSection; 