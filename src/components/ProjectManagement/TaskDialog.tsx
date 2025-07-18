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

const TaskDialog: React.FC<TaskDialogProps> = ({ open, task, projectId, lamportCounter, onClose, onSubmit, loading }) => {
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
            // Convert any date format to YYYY-MM-DD format for the date input
            let dueDateFormatted = '';
            if (task.configuration.dueDate) {
                try {
                    // Handle both ISO dates and YYYY-MM-DD formats
                    let dateStr = task.configuration.dueDate;
                    if (dateStr.includes('T')) {
                        // It's an ISO date, extract just the date part
                        dateStr = dateStr.split('T')[0];
                    }
                    // Ensure it's in YYYY-MM-DD format
                    const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone issues
                    dueDateFormatted = date.toISOString().split('T')[0];
                    console.log('🔍 Converting due date for edit:', {
                        original: task.configuration.dueDate,
                        processed: dateStr,
                        formatted: dueDateFormatted
                    });
                } catch (error) {
                    console.warn('Invalid due date format:', task.configuration.dueDate);
                    dueDateFormatted = '';
                }
            }
            
            setFormData({
                title: task.title,
                description: task.configuration.description || '',
                status: task.status === 'in_progress' ? 'in-progress' : task.status,
                priority: task.configuration.priority,
                dueDate: dueDateFormatted
            });
            // Use task's timestamp if available, otherwise use lamportCounter
            setLamportTs(task.lamportTs || lamportCounter);
        } else {
            setFormData({
                title: '',
                description: '',
                status: 'pending' as 'pending' | 'in-progress' | 'completed',
                priority: 1,
                dueDate: ''
            });
            // For new tasks, use lamportCounter
            setLamportTs(lamportCounter);
        }
    }, [task, open, lamportCounter]); // Add 'open' to reset when dialog opens/closes

    const handleSubmit = () => {
        // Ensure consistent date format when saving
        let dueDate = undefined;
        if (formData.dueDate) {
            try {
                // Ensure the date is in YYYY-MM-DD format
                const date = new Date(formData.dueDate + 'T12:00:00'); // Use noon to avoid timezone issues
                dueDate = date.toISOString().split('T')[0];
                console.log('🔍 Saving due date:', {
                    input: formData.dueDate,
                    processed: dueDate
                });
            } catch (error) {
                console.warn('Invalid due date format:', formData.dueDate);
                dueDate = formData.dueDate; // Fallback to original value
            }
        }
        
        // Include Lamport timestamp in the form data
        onSubmit({
            title: formData.title,
            configuration: {
                description: formData.description,
                priority: formData.priority,
                dueDate: dueDate
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
                        // Convert any date format to YYYY-MM-DD format for the date input
                        let dueDateFormatted = '';
                        if (task.configuration.dueDate) {
                            try {
                                // Handle both ISO dates and YYYY-MM-DD formats
                                let dateStr = task.configuration.dueDate;
                                if (dateStr.includes('T')) {
                                    // It's an ISO date, extract just the date part
                                    dateStr = dateStr.split('T')[0];
                                }
                                // Ensure it's in YYYY-MM-DD format
                                const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone issues
                                dueDateFormatted = date.toISOString().split('T')[0];
                            } catch (error) {
                                console.warn('Invalid due date format:', task.configuration.dueDate);
                                dueDateFormatted = '';
                            }
                        }
                        
                        setFormData({
                            title: task.title,
                            description: task.configuration.description || '',
                            status: task.status === 'in_progress' ? 'in-progress' : task.status,
                            priority: task.configuration.priority,
                            dueDate: dueDateFormatted
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