import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Alert, CircularProgress } from '@mui/material';

const ApiTest: React.FC = () => {
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);

    const testHealthEndpoint = async () => {
        setLoading(true);
        setError('');
        setSuccess(false);
        setResult('');
        
        try {
            console.log('Testing health endpoint...');
            const response = await fetch('http://localhost:8080/api/health');
            console.log('Health response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                setError(`Health check failed: ${response.status} - ${errorText}`);
                setResult(`Health check failed: ${response.status} - ${errorText}`);
                return;
            }
            
            const data = await response.json();
            console.log('Health check success:', data);
            setSuccess(true);
            setResult(`Health check passed: ${JSON.stringify(data, null, 2)}`);
        } catch (error) {
            console.error('Health check error:', error);
            setError(`Health check error: ${error}`);
            setResult(`Health check failed: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const testClientInfo = async () => {
        setLoading(true);
        setError('');
        setSuccess(false);
        setResult('');
        
        try {
            console.log('Testing client-info endpoint...');
            const response = await fetch('http://localhost:8080/api/client-info');
            console.log('Client info response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                setError(`Client info failed: ${response.status} - ${errorText}`);
                setResult(`Client info failed: ${response.status} - ${errorText}`);
                return;
            }
            
            const data = await response.json();
            console.log('Client info success:', data);
            setSuccess(true);
            setResult(`Client info: ${JSON.stringify(data, null, 2)}`);
        } catch (error) {
            console.error('Client info error:', error);
            setError(`Client info error: ${error}`);
            setResult(`Client info failed: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const testTasksAPI = async () => {
        setLoading(true);
        setError('');
        setSuccess(false);
        setResult('');
        
        try {
            console.log('Testing tasks API...');
            const response = await fetch('http://localhost:8080/api/tasks');
            console.log('Tasks response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                setError(`Tasks API failed: ${response.status} - ${errorText}`);
                setResult(`Tasks API failed: ${response.status} - ${errorText}`);
                return;
            }
            
            const data = await response.json();
            console.log('Tasks API success:', data);
            setSuccess(true);
            setResult(`Tasks API: ${JSON.stringify(data, null, 2)}`);
        } catch (error) {
            console.error('Tasks API error:', error);
            setError(`Tasks API error: ${error}`);
            setResult(`Tasks API failed: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const testProjectsAPI = async () => {
        setLoading(true);
        setError('');
        setSuccess(false);
        setResult('');
        
        try {
            console.log('Testing projects API...');
            const response = await fetch('http://localhost:8080/api/projects');
            console.log('Projects response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                setError(`Projects API failed: ${response.status} - ${errorText}`);
                setResult(`Projects API failed: ${response.status} - ${errorText}`);
                return;
            }
            
            const data = await response.json();
            console.log('Projects API success:', data);
            setSuccess(true);
            setResult(`Projects API: ${JSON.stringify(data, null, 2)}`);
        } catch (error) {
            console.error('Projects API error:', error);
            setError(`Projects API error: ${error}`);
            setResult(`Projects API failed: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 3, m: 2 }}>
            <Typography variant="h6" gutterBottom>
                API Test Component (Direct Backend)
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Testing backend API endpoints directly. Backend is running on localhost:8080.
            </Typography>
            
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                    variant="contained" 
                    onClick={testHealthEndpoint}
                    disabled={loading}
                >
                    Test Health
                </Button>
                
                <Button 
                    variant="contained" 
                    onClick={testClientInfo}
                    disabled={loading}
                >
                    Test Client Info
                </Button>
                
                <Button 
                    variant="contained" 
                    onClick={testTasksAPI}
                    disabled={loading}
                >
                    Test Tasks API
                </Button>
                
                <Button 
                    variant="contained" 
                    onClick={testProjectsAPI}
                    disabled={loading}
                >
                    Test Projects API
                </Button>
            </Box>
            
            {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography>Testing API...</Typography>
                </Box>
            )}
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            
            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    API test successful!
                </Alert>
            )}
            
            {result && (
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Result:
                    </Typography>
                    <Typography 
                        variant="body2" 
                        component="pre" 
                        sx={{ 
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: '0.875rem',
                            fontFamily: 'monospace'
                        }}
                    >
                        {result}
                    </Typography>
                </Paper>
            )}
        </Paper>
    );
};

export default ApiTest; 