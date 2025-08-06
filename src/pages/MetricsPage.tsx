import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Container,
    Grid,
    Paper,
    Card,
    CardContent,
    CardHeader,
    Divider,
    CircularProgress,
    Alert,
    IconButton,
    Chip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SecurityIcon from '@mui/icons-material/Security';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Header from '../components/Header';

interface FindingsData {
    total_pdfs_processed: number;
    total_pii_items: number;
    success_rate: number;
    avg_processing_time: number;
    p95_processing_time: number;
    pii_types: {
        emails: number;
        ssns: number;
    };
    processing_trends: Array<{
        date: string;
        uploads: number;
        avg_time: number;
    }>;
    recent_uploads: Array<{
        upload_id: string;
        filename: string;
        upload_date: string;
        status: string;
        email_count: number;
        ssn_count: number;
        processing_time: number;
    }>;
}

const MetricsPage: React.FC = () => {
    const [findings, setFindings] = useState<FindingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFindings = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/findings');
            if (response.ok) {
                const data = await response.json();
                setFindings(data);
            } else {
                throw new Error('Failed to fetch findings');
            }
        } catch (err) {
            setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Failed to fetch analytics data');
        } finally {
            setLoading(false);
        }
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

    const handleDownloadRedactedPDF = async (uploadId: string, filename: string) => {
        try {
            const response = await fetch(`http://localhost:8080/api/download-redacted-pdf/${uploadId}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                // Create redacted filename
                const name = filename.replace('.pdf', '');
                a.download = `${name}_redacted.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error('Redacted download failed:', response.status);
            }
        } catch (err) {
            console.error('Redacted download error:', err);
        }
    };

    useEffect(() => {
        fetchFindings();
    }, []);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!findings) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
                <Alert severity="info">
                    No analytics data available
                </Alert>
            </Container>
        );
    }

    // Prepare chart data from real findings
    const piiTypeData = [
        { name: 'Email Addresses', value: findings.pii_types.emails, color: '#8884d8' },
        { name: 'Social Security Numbers', value: findings.pii_types.ssns, color: '#82ca9d' },
    ];

    const processingTimeData = findings.processing_trends.map(trend => ({
        day: new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' }),
        avgTime: trend.avg_time,
        uploads: trend.uploads
    }));

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Analytics & Metrics
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    PDF processing statistics and PII detection analytics
                </Typography>
            </Box>
            
            <Header />

            {/* Analytics Section */}
            <Box sx={{ 
                mt: 6, 
                mb: 4, 
                p: 3, 
                borderRadius: 2, 
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                border: '1px solid #dee2e6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'text.primary' }}>
                    📊 Analytics Overview
                </Typography>
                
                {/* Summary Cards */}
                <Grid container spacing={3} sx={{ mb: 4, mt: 2 }}>
                <Grid item xs={12} sm={6} lg={2.4}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                                Total PDFs Processed
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                {findings.total_pdfs_processed.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.8)">
                                All time
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} lg={2.4}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                                Success Rate
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                {findings.success_rate}%
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.8)">
                                Processing success
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} lg={2.4}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                                Avg Processing Time
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                {findings.avg_processing_time}s
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.8)">
                                Per PDF
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} lg={2.4}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                                Total PII Items
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                {findings.total_pii_items}
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.8)">
                                Detected & flagged
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} lg={2.4}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                                P95 Processing Time
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                {findings.p95_processing_time}s
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.8)">
                                95th percentile
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                </Grid>
            </Box>

            {/* Charts Container */}
            <Paper sx={{ p: 4, mt: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'text.primary' }}>
                    📊 Analytics Dashboard
                </Typography>
                
                <Grid container spacing={3}>
                    {/* PII Types Distribution */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, height: '100%', boxShadow: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, letterSpacing: '0.2em' }}>
                                🎯   PII   Types   Detected
                            </Typography>
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={piiTypeData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                                        outerRadius={150}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {piiTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, name]} />
                                </PieChart>
                            </ResponsiveContainer>
                            
                            {/* Colored Legend */}
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                                {piiTypeData.map((entry, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box 
                                            sx={{ 
                                                width: 16, 
                                                height: 16, 
                                                borderRadius: '50%', 
                                                backgroundColor: entry.color,
                                                border: '2px solid #fff',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }} 
                                        />
                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                            {entry.name} ({entry.value})
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Processing Time Trends */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 3, height: '100%', boxShadow: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                ⏱️ Processing Time Trends
                            </Typography>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={processingTimeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="avgTime" fill="#8884d8" name="Average Time (s)" />
                                    <Bar yAxisId="right" dataKey="uploads" fill="#82ca9d" name="Upload Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Recent Uploads Table */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, height: '100%', boxShadow: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                📋 Recent Uploads
                            </Typography>
                            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                <Grid container spacing={2}>
                                    {findings.recent_uploads.map((upload, index) => (
                                        <Grid item xs={12} key={index}>
                                            <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography variant="body1" fontWeight="medium">
                                                            {upload.filename}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {new Date(upload.upload_date).toLocaleString()}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Box sx={{ textAlign: 'right' }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Status: {upload.status}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Emails: {upload.email_count} • SSNs: {upload.ssn_count}
                                                                {upload.redaction_applied && (
                                                                    <span> • Redactions: {upload.total_redactions}</span>
                                                                )}
                                                                {upload.redacted_file_available && (
                                                                    <Chip 
                                                                        label="Redacted" 
                                                                        size="small" 
                                                                        color="success" 
                                                                        variant="outlined"
                                                                        icon={<SecurityIcon />}
                                                                        sx={{ ml: 1, fontSize: '0.6rem' }}
                                                                    />
                                                                )}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Time: {upload.processing_time.toFixed(3)}s
                                                            </Typography>
                                                        </Box>
                                                        {(upload.status === 'complete' || upload.status === 'completed') && (
                                                            <>
                                                                <IconButton 
                                                                    size="small"
                                                                    onClick={() => handleDownloadPDF(upload.upload_id, upload.filename)}
                                                                    title="Download Original PDF"
                                                                    sx={{ color: 'black' }}
                                                                >
                                                                    <DownloadIcon />
                                                                </IconButton>
                                                                {upload.redacted_file_available && (
                                                                    <IconButton 
                                                                        size="small"
                                                                        onClick={() => handleDownloadRedactedPDF(upload.upload_id, upload.filename)}
                                                                        title="Download Redacted PDF (PII Removed)"
                                                                        sx={{ 
                                                                            color: 'success.main',
                                                                            backgroundColor: 'success.light',
                                                                            border: '2px solid',
                                                                            borderColor: 'success.main',
                                                                            '&:hover': {
                                                                                backgroundColor: 'success.main',
                                                                                color: 'white',
                                                                                borderColor: 'success.dark'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <SecurityIcon />
                                                                    </IconButton>
                                                                )}
                                                            </>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default MetricsPage; 