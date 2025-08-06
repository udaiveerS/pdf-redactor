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
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
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
    emails?: string[];
    ssns?: string[];
    processingTime?: number;
    textLength?: number;
}

const PDFPage: React.FC = () => {
    const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
    const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
    const [selectedUpload, setSelectedUpload] = useState<PDFUpload | null>(null);

    // Upload history from backend
    const [pdfUploads, setPdfUploads] = useState<PDFUpload[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

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

    const fetchUploadHistory = async () => {
        setLoadingHistory(true);
        try {
            const response = await fetch('http://localhost:8080/api/upload-history');
            if (response.ok) {
                const data = await response.json();
                console.log('Upload history data:', data);
                
                // For now, we'll use the counts from the backend
                // In a real implementation, you'd fetch the actual emails/SSNs for each upload
                const uploads: PDFUpload[] = data.uploads.map((upload: any) => ({
                    id: upload.upload_id,
                    filename: upload.filename,
                    uploadDate: upload.upload_date,
                    status: upload.status,
                    size: formatFileSize(upload.file_size),
                    pages: upload.pages_processed,
                    emails: upload.email_count > 0 ? Array(upload.email_count).fill('email@example.com') : [], // Placeholder
                    ssns: upload.ssn_count > 0 ? Array(upload.ssn_count).fill('123-45-6789') : [], // Placeholder
                    processingTime: upload.processing_time
                }));
                setPdfUploads(uploads);
            } else {
                console.error('Failed to fetch upload history:', response.status);
            }
        } catch (err) {
            console.error('Error fetching upload history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        checkServerStatus();
        fetchUploadHistory();
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
        
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            const response = await fetch('http://localhost:8080/api/upload-pdf', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Upload successful:', result);
                
                // Add the new upload to the list with processing status
                const newUpload: PDFUpload = {
                    id: result.upload_id,
                    filename: selectedFile.name,
                    uploadDate: new Date().toISOString(),
                    status: 'processing',
                    size: formatFileSize(selectedFile.size),
                    pages: 0,
                    emails: [],
                    ssns: []
                };
                
                setPdfUploads(prev => [newUpload, ...prev]);
                setSelectedFile(null);
                
                // Poll for status updates
                pollUploadStatus(result.upload_id);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const pollUploadStatus = async (uploadId: string) => {
        const maxAttempts = 30; // 30 seconds max
        let attempts = 0;
        
        const poll = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/upload-status/${uploadId}`);
                if (response.ok) {
                    const result = await response.json();
                    
                    // Update the upload in the list
                    setPdfUploads(prev => prev.map(upload => 
                        upload.id === uploadId 
                            ? {
                                ...upload,
                                status: result.status,
                                pages: result.pages_processed,
                                emails: result.emails,
                                ssns: result.ssns,
                                processingTime: result.processing_time
                            }
                            : upload
                    ));
                    
                    // Stop polling if processing is complete
                    if (result.status === 'complete' || result.status === 'failed') {
                        return;
                    }
                }
                
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(poll, 1000); // Poll every second
                }
            } catch (err) {
                console.error('Status polling error:', err);
            }
        };
        
        poll();
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) {
            return `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        } else {
            return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
        }
    };

    const handleDeleteUpload = (id: string) => {
        setPdfUploads(prev => prev.filter(upload => upload.id !== id));
    };

    const handleUploadClick = (upload: PDFUpload) => {
        setSelectedUpload(upload);
        setSummaryDialogOpen(true);
    };

    const handleCloseSummary = () => {
        setSummaryDialogOpen(false);
        setSelectedUpload(null);
    };

    const handleDownloadPDF = async (uploadId: string, filename: string) => {
        try {
            const response = await fetch(`http://localhost:8080/api/download-pdf/${uploadId}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error('Download failed:', response.status);
            }
        } catch (err) {
            console.error('Download error:', err);
        }
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
                            Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="medium">
                        Upload History
                    </Typography>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={fetchUploadHistory}
                        size="small"
                        disabled={loadingHistory}
                    >
                        Refresh
                    </Button>
                </Box>
                
                {loadingHistory ? (
                    <Box sx={{ 
                        textAlign: 'center', 
                        py: 4,
                        color: 'text.secondary'
                    }}>
                        <CircularProgress size={48} sx={{ mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Loading upload history...
                        </Typography>
                    </Box>
                ) : pdfUploads.length === 0 ? (
                    <Box sx={{ 
                        textAlign: 'center', 
                        py: 4,
                        color: 'text.secondary'
                    }}>
                        <DescriptionIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" gutterBottom>
                            No PDFs uploaded yet
                        </Typography>
                        <Typography variant="body2">
                            Upload your first PDF to see it appear here
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {pdfUploads.map((upload, index) => (
                            <React.Fragment key={upload.id}>
                                <ListItem 
                                    onClick={() => handleUploadClick(upload)}
                                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                                >
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
                                            Size: {upload.size} • Pages: {upload.pages > 0 ? upload.pages : 'Processing...'}
                                        </Typography>
                                        {upload.status === 'completed' && (
                                            <Typography variant="body2" color="text.secondary">
                                                Emails: {upload.emails?.length || 0} • SSNs: {upload.ssns?.length || 0} (Masked)
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip 
                                            label={upload.status} 
                                            color={getUploadStatusColor(upload.status)}
                                            size="small"
                                        />
                                        <IconButton 
                                            size="small" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteUpload(upload.id);
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                        {upload.status === 'completed' && (
                                            <IconButton 
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadPDF(upload.id, upload.filename);
                                                }}
                                                title="Download PDF"
                                            >
                                                <DownloadIcon />
                                            </IconButton>
                                        )}
                                    </Box>
                                </ListItem>
                                {index < pdfUploads.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Upload Summary Dialog */}
            <Dialog 
                open={summaryDialogOpen} 
                onClose={handleCloseSummary}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    PDF Processing Summary
                </DialogTitle>
                <DialogContent>
                    {selectedUpload && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {selectedUpload.filename}
                            </Typography>
                            
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Upload Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {new Date(selectedUpload.uploadDate).toLocaleString()}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        File Size
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedUpload.size}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Pages Processed
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedUpload.pages > 0 ? selectedUpload.pages : 'Processing...'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Processing Time
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedUpload.processingTime ? `${selectedUpload.processingTime.toFixed(2)}s` : 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    PII Detection Results
                                </Typography>
                                
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary">
                                            {selectedUpload.emails?.length || 0}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Email Addresses
                                        </Typography>
                                    </Paper>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" color="error">
                                            {selectedUpload.ssns?.length || 0}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Social Security Numbers
                                        </Typography>
                                    </Paper>
                                </Box>
                            </Box>

                            {selectedUpload.emails && selectedUpload.emails.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Detected Emails (Masked for Privacy)
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {selectedUpload.emails.map((email, index) => (
                                            <Chip 
                                                key={index} 
                                                label={email} 
                                                size="small" 
                                                color="warning"
                                                title="PII data is masked for privacy"
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {selectedUpload.ssns && selectedUpload.ssns.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Detected SSNs (Masked for Privacy)
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {selectedUpload.ssns.map((ssn, index) => (
                                            <Chip 
                                                key={index} 
                                                label={ssn} 
                                                size="small" 
                                                color="error" 
                                                title="PII data is masked for privacy"
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {selectedUpload.extractedText && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Extracted Text Preview
                                    </Typography>
                                    <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                                        <Typography variant="body2">
                                            {selectedUpload.extractedText.substring(0, 500)}
                                            {selectedUpload.extractedText.length > 500 && '...'}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSummary}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default PDFPage; 