import React, { useState, useEffect } from 'react';
import { 
    Paper, 
    Typography, 
    Box, 
    Chip, 
    CircularProgress,
    Alert,
    Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ServerStatus {
    status: string;
    message: string;
    server: string;
    version: string;
}

interface ServerInfo {
    status: string;
    server: string;
    port: number;
    endpoints: string[];
    capabilities: string[];
}

const PythonServerStatus: React.FC = () => {
    const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
    const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkServerStatus = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Check health endpoint
            const healthResponse = await fetch('http://localhost:8080/api/health');
            if (healthResponse.ok) {
                const healthData: ServerStatus = await healthResponse.json();
                setServerStatus(healthData);
            } else {
                throw new Error(`Health check failed: ${healthResponse.status}`);
            }

            // Check server info endpoint
            const infoResponse = await fetch('http://localhost:8080/api/python-server-status');
            if (infoResponse.ok) {
                const infoData: ServerInfo = await infoResponse.json();
                setServerInfo(infoData);
            }
        } catch (err) {
            setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Failed to connect to Python server');
            setServerStatus(null);
            setServerInfo(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkServerStatus();
    }, []);

    const getStatusColor = (status: string) => {
        return status === 'healthy' || status === 'running' ? 'success' : 'error';
    };

    const getStatusIcon = (status: string) => {
        return status === 'healthy' || status === 'running' ? <CheckCircleIcon /> : <ErrorIcon />;
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="h6">Checking Python Server Status...</Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="medium">
                    Python Server Status
                </Typography>
                <Button
                    startIcon={<RefreshIcon />}
                    onClick={checkServerStatus}
                    size="small"
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>

            {error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            ) : (
                <>
                    {serverStatus && (
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {getStatusIcon(serverStatus.status)}
                                <Typography variant="body1" fontWeight="medium">
                                    {serverStatus.server}
                                </Typography>
                                <Chip 
                                    label={serverStatus.status} 
                                    color={getStatusColor(serverStatus.status)}
                                    size="small"
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {serverStatus.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Version: {serverStatus.version}
                            </Typography>
                        </Box>
                    )}

                    {serverInfo && (
                        <Box>
                            <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 1 }}>
                                Capabilities:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {serverInfo.capabilities.map((capability, index) => (
                                    <Chip 
                                        key={index}
                                        label={capability} 
                                        size="small" 
                                        variant="outlined"
                                        color="primary"
                                    />
                                ))}
                            </Box>
                            
                            <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 1 }}>
                                Available Endpoints:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {serverInfo.endpoints.map((endpoint, index) => (
                                    <Chip 
                                        key={index}
                                        label={endpoint} 
                                        size="small" 
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </Paper>
    );
};

export default PythonServerStatus; 