import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Container
} from '@mui/material';
import ProjectManagement from '../components/ProjectManagement';
import Header from '../components/Header';
import PythonServerStatus from '../components/PythonServerStatus';
import { useClickOutside } from '../hooks/useClickOutside';

const TasksPage: React.FC = () => {
    const [dialogsOpen, setDialogsOpen] = useState(false);

    const handleUnfocusProject = () => {
        console.log('🖱️ Click outside detected, dialogs open:', dialogsOpen);
        // Don't unfocus if dialogs are open
        if (dialogsOpen) {
            console.log('❌ Not unfocusing - dialogs are open');
            return;
        }
        console.log('📤 Dispatching unfocus event');
        // Add a longer delay to ensure dialogs have time to close properly
        setTimeout(() => {
            // Check again in case dialog state changed
            if (!dialogsOpen) {
                window.dispatchEvent(new CustomEvent('unfocus-project'));
            }
        }, 200); // Increased from 10ms to 200ms
    };

    // Listen for dialog state changes
    useEffect(() => {
        const handleDialogStateChange = (event: CustomEvent) => {
            const { projectDialogOpen, taskDialogOpen } = event.detail;
            const newDialogsOpen = projectDialogOpen || taskDialogOpen;
            console.log('📨 Dialog state event received:', { projectDialogOpen, taskDialogOpen, newDialogsOpen });
            setDialogsOpen(newDialogsOpen);
        };

        window.addEventListener('dialog-state-changed', handleDialogStateChange as EventListener);

        return () => {
            window.removeEventListener('dialog-state-changed', handleDialogStateChange as EventListener);
        };
    }, []);

    const projectManagementRef = useClickOutside({
        onOutsideClick: handleUnfocusProject,
        enabled: !dialogsOpen // Disable when dialogs are open
    });

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Project List
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Welcome to PDF Redactor
                </Typography>
            </Box>
            
            <Header />
            <PythonServerStatus />
            <Box sx={{ mt: 3 }} ref={projectManagementRef}>
                <ProjectManagement />
            </Box>
        </Container>
    );
};

export default TasksPage; 