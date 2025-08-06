import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Container,
    Paper,
    Button,
    Alert,
    Chip,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    CardActions,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadIcon from '@mui/icons-material/Upload';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import Header from '../components/Header';

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

interface PDFUpload {
    id: string;
    filename: string;
    uploadDate: string;
    status: 'processing' | 'completed' | 'failed';
    size: string;
    pages: number;
    extractedText?: string;
}

const PDFPage: React.FC = () => {
    const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
    const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Mock data for PDF uploads
    const [pdfUploads, setPdfUploads] = useState<PDFUpload[]>([
        {
            id: '1',
            filename: 'document1.pdf',
            uploadDate: '2024-01-15T10:30:00Z',
            status: 'completed',
            size: '2.5 MB',
            pages: 15,
            extractedText: 'Sample extracted text from document 1...'
        },
        {
            id: '2',
            filename: 'report.pdf',
            uploadDate: '2024-01-14T14:20:00Z',
            status: 'completed',
            size: '1.8 MB',
            pages: 8,
            extractedText: 'Sample extracted text from report...'
        },
        {
            id: '3',
            filename: 'contract.pdf',
            uploadDate: '2024-01-13T09:15:00Z',
            status: 'processing',
            size: '3.2 MB',
            pages: 12
        }
    ]);

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

    const getUploadStatusColor = (status: PDFUpload['status']) => {
        switch (status) {
            case 'completed': return 'success';
            case 'processing': return 'warning';
            case 'failed': return 'error';
            default: return 'default';
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        
        // Simulate upload process
        setTimeout(() => {
            const newUpload: PDFUpload = {
                id: Date.now().toString(),
                filename: selectedFile.name,
                uploadDate: new Date().toISOString(),
                status: 'processing',
                size: `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`,
                pages: 0
            };

            setPdfUploads(prev => [newUpload, ...prev]);
            setSelectedFile(null);
            setUploading(false);

            // Simulate processing completion
            setTimeout(() => {
                setPdfUploads(prev => prev.map(upload => 
                    upload.id === newUpload.id 
                        ? { ...upload, status: 'completed' as const, pages: Math.floor(Math.random() * 20) + 1 }
                        : upload
                ));
            }, 3000);
        }, 2000);
    };

    const handleDeleteUpload = (id: string) => {
        setPdfUploads(prev => prev.filter(upload => upload.id !== id));
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    PDF Redactor
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Upload PDFs for sensitive data detection and redaction
                </Typography>
            </Box>
            
            <Header />

            {/* Server Status */}
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

                {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={20} />
                        <Typography>Checking server status...</Typography>
                    </Box>
                ) : error ? (
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
                            </Box>
                        )}
                    </>
                )}
            </Paper>

            {/* PDF Upload Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                    Upload PDF
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        disabled={uploading}
                    >
                        Select PDF File
                        <input
                            type="file"
                            hidden
                            accept=".pdf"
                            onChange={handleFileSelect}
                        />
                    </Button>
                    
                    {selectedFile && (
                        <Typography variant="body2" color="text.secondary">
                            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                        </Typography>
                    )}
                </Box>

                {selectedFile && (
                    <Button
                        variant="contained"
                        onClick={handleUpload}
                        disabled={uploading}
                        startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
                        sx={{ mb: 2 }}
                    >
                        {uploading ? 'Uploading...' : 'Upload PDF'}
                    </Button>
                )}
            </Paper>

            {/* Upload History */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                    Upload History
                </Typography>
                
                <List>
                    {pdfUploads.map((upload, index) => (
                        <React.Fragment key={upload.id}>
                            <ListItem>
                                <ListItemIcon>
                                    <DescriptionIcon />
                                </ListItemIcon>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body1" fontWeight="medium">
                                        {upload.filename}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Uploaded: {new Date(upload.uploadDate).toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Size: {upload.size} • Pages: {upload.pages || 'Processing...'}
                                    </Typography>
                                    {upload.extractedText && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            Extracted Text: {upload.extractedText.substring(0, 100)}...
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip 
                                        label={upload.status} 
                                        color={getUploadStatusColor(upload.status)}
                                        size="small"
                                    />
                                    <IconButton size="small" onClick={() => handleDeleteUpload(upload.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                    {upload.status === 'completed' && (
                                        <IconButton size="small">
                                            <DownloadIcon />
                                        </IconButton>
                                    )}
                                </Box>
                            </ListItem>
                            {index < pdfUploads.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
        </Container>
    );
};

export default PDFPage; 