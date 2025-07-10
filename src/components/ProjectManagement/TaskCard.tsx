import React from 'react';
import { Card, CardContent, CardActions, Typography, Box, Chip, Button } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { TaskNode } from '../../../shared/types';
import { TaskCardProps } from './types';

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'success';
            case 'in-progress': return 'warning';
            case 'pending': return 'info';
            default: return 'default';
        }
    };

    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 1: return 'success';
            case 2: return 'info';
            case 3: return 'warning';
            case 4: return 'error';
            default: return 'default';
        }
    };

    return (
        <Card sx={{ mb: 3, p: 2, width: '100%' }}>
            <CardContent sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, width: '100%' }}>
                    <Typography variant="h6" component="div" sx={{ flex: 1 }}>
                        {task.title}
                    </Typography>
                    <Box>
                        <Chip
                            label={task.status}
                            color={getStatusColor(task.status) as any}
                            size="medium"
                            sx={{ mr: 1 }}
                        />
                        <Chip
                            label={`P${task.configuration.priority}`}
                            color={getPriorityColor(task.configuration.priority) as any}
                            size="medium"
                        />
                    </Box>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {task.configuration.description}
                </Typography>
                {task.configuration.dueDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ScheduleIcon sx={{ fontSize: 20, mr: 1 }} />
                        <Typography variant="body2">
                            Due: {new Date(task.configuration.dueDate).toLocaleDateString()}
                        </Typography>
                    </Box>
                )}
            </CardContent>
            <CardActions sx={{ p: 0, pt: 2 }}>
                <Button
                    size="medium"
                    startIcon={<EditIcon />}
                    onClick={() => onEdit(task)}
                >
                    Edit
                </Button>
                <Button
                    size="medium"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => onDelete(task.id)}
                >
                    Delete
                </Button>
            </CardActions>
        </Card>
    );
};

export default TaskCard; 