import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent
} from '@mui/material';
import { TaskNode } from '../../../shared/types';
import { TaskDialogProps } from './types';

const TaskDialog: React.FC<TaskDialogProps> = ({ open, task, projectId, onClose, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'pending' as 'pending' | 'in-progress' | 'completed',
        priority: 1,
        dueDate: ''
    });

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.configuration.description,
                status: task.status,
                priority: task.configuration.priority,
                dueDate: task.configuration.dueDate ? new Date(task.configuration.dueDate).toISOString().split('T')[0] : ''
            });
        } else {
            setFormData({
                title: '',
                description: '',
                status: 'pending' as 'pending' | 'in-progress' | 'completed',
                priority: 1,
                dueDate: ''
            });
        }
    }, [task]);

    const handleSubmit = () => {
        onSubmit({
            title: formData.title,
            configuration: {
                description: formData.description,
                priority: formData.priority,
                dueDate: formData.dueDate || undefined
            },
            status: formData.status
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {task ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Task Title"
                    fullWidth
                    variant="outlined"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    sx={{ mb: 2 }}
                />
                <TextField
                    margin="dense"
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    sx={{ mb: 2 }}
                />
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={formData.status}
                                label="Status"
                                onChange={(e: SelectChangeEvent) => setFormData({ ...formData, status: e.target.value as 'pending' | 'in-progress' | 'completed' })}
                            >
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="in-progress">In Progress</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={formData.priority.toString()}
                                label="Priority"
                                onChange={(e: SelectChangeEvent) => setFormData({ ...formData, priority: Number(e.target.value) })}
                            >
                                <MenuItem value={1}>Low</MenuItem>
                                <MenuItem value={2}>Medium</MenuItem>
                                <MenuItem value={3}>High</MenuItem>
                                <MenuItem value={4}>Critical</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <TextField
                    margin="dense"
                    label="Due Date"
                    type="date"
                    fullWidth
                    variant="outlined"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mt: 2 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading || !formData.title.trim()}>
                    {task ? 'Update' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TaskDialog; 