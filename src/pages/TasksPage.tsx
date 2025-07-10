import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ProjectManagement from '../components/ProjectManagement';

const TasksPage: React.FC = () => {
    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Project Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage your projects and tasks efficiently
                </Typography>
            </Box>
            
            <ProjectManagement />
        </Container>
    );
};

export default TasksPage; 