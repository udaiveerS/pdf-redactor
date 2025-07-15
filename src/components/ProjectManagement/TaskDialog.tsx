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
    SelectChangeEvent,
    Box,
    CircularProgress
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

    // Track Lamport timestamp for this dialog instance
    const [lamportTs, setLamportTs] = useState(0);

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.configuration.description || '',
                status: task.status === 'in_progress' ? 'in-progress' : task.status,
                priority: task.configuration.priority,
                dueDate: task.configuration.dueDate || ''
            });
            // Use task's timestamp if available, otherwise use current time
            setLamportTs(task.lamportTs || Date.now());
        } else {
            setFormData({
                title: '',
                description: '',
                status: 'pending' as 'pending' | 'in-progress' | 'completed',
                priority: 1,
                dueDate: ''
            });
            // For new tasks, use current timestamp
            setLamportTs(Date.now());
        }
    }, [task, open]); // Add 'open' to reset when dialog opens/closes

    const handleSubmit = () => {
        // Include Lamport timestamp in the form data
        onSubmit({
            title: formData.title,
            configuration: {
                description: formData.description,
                priority: formData.priority,
                dueDate: formData.dueDate || undefined
            },
            status: formData.status === 'in-progress' ? 'in_progress' : formData.status,
            lamportTs: lamportTs
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {task ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        autoFocus
                        label="Task Title"
                        fullWidth
                        variant="outlined"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        sx={{ mt: 1 }}
                    />
                    <TextField
                        label="Description"
                        fullWidth
                        variant="outlined"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <TextField
                        label="Due Date"
                        type="date"
                        fullWidth
                        variant="outlined"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        InputLabelProps={{
                            shrink: true,
                        }}
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
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    // Reset form data to original values
                    if (task) {
                        setFormData({
                            title: task.title,
                            description: task.configuration.description || '',
                            status: task.status === 'in_progress' ? 'in-progress' : task.status,
                            priority: task.configuration.priority,
                            dueDate: task.configuration.dueDate || ''
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
                    // Add a small delay to prevent interference with click-outside detection
                    setTimeout(() => onClose(), 50);
                }}>Cancel</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={loading || !formData.title.trim()}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
                >
                    {task ? 'Update' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TaskDialog; 