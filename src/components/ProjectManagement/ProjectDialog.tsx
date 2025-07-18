import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Stack,
    Box,
    CircularProgress
} from '@mui/material';
import { ProjectDialogProps } from './types';

const ProjectDialog: React.FC<ProjectDialogProps> = ({ open, project, lamportCounter, onClose, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    // Track Lamport timestamp for this dialog instance
    const [lamportTs, setLamportTs] = useState(0);

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name,
                description: project.description
            });
            // Use project's timestamp if available, otherwise use lamportCounter
            setLamportTs(project.lamportTs || lamportCounter);
        } else {
            setFormData({
                name: '',
                description: ''
            });
            // For new projects, use lamportCounter
            setLamportTs(lamportCounter);
        }
    }, [project, open, lamportCounter]); // Add 'open' to reset when dialog opens/closes

    const handleSubmit = () => {
        // Include Lamport timestamp in the form data
        onSubmit({
            ...formData,
            lamportTs: lamportTs
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {project ? 'Edit Project' : 'Create New Project'}
            </DialogTitle>
            <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    autoFocus
                    label="Project Name"
                    fullWidth
                    variant="outlined"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    sx={{ mt: 1 }}
                />
                <TextField
                    label="Description"
                    fullWidth
                    variant="outlined"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
            </Box>
        </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    // Reset form data to original values
                    if (project) {
                        setFormData({
                            name: project.name,
                            description: project.description
                        });
                    } else {
                        setFormData({
                            name: '',
                            description: ''
                        });
                    }
                    // Add a small delay to prevent interference with click-outside detection
                    setTimeout(() => onClose(), 50);
                }}>Cancel</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={loading || !formData.name.trim()}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
                >
                    {project ? 'Update' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProjectDialog; 