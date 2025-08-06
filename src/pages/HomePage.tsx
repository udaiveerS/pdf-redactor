import React from 'react';
import { 
    Box, 
    Typography, 
    Container
} from '@mui/material';
import Header from '../components/Header';
import MainGrid from '../components/MainGrid';
import ApiTest from '../components/ApiTest';

const HomePage: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Welcome to PDF Redactor
                </Typography>
            </Box>
            
            <Header />
            <MainGrid />
            <ApiTest />
        </Container>
    );
};

export default HomePage; 