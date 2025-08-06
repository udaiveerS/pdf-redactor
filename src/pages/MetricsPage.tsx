import React from 'react';
import { 
    Box, 
    Typography, 
    Container,
    Grid,
    Paper,
    Card,
    CardContent,
    CardHeader,
    Divider
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Header from '../components/Header';

// Sample data for charts
const weeklyProcessingData = [
    { week: 'Week 1', totalPDFs: 45, withPII: 12, withoutPII: 33 },
    { week: 'Week 2', totalPDFs: 67, withPII: 18, withoutPII: 49 },
    { week: 'Week 3', totalPDFs: 89, withPII: 23, withoutPII: 66 },
    { week: 'Week 4', totalPDFs: 123, withPII: 34, withoutPII: 89 },
    { week: 'Week 5', totalPDFs: 156, withPII: 42, withoutPII: 114 },
    { week: 'Week 6', totalPDFs: 189, withPII: 51, withoutPII: 138 },
];

const piiTypeData = [
    { name: 'Email Addresses', value: 234, color: '#8884d8' },
    { name: 'Social Security Numbers', value: 89, color: '#82ca9d' },
    { name: 'Credit Card Numbers', value: 45, color: '#ffc658' },
    { name: 'Phone Numbers', value: 156, color: '#ff7300' },
    { name: 'Addresses', value: 78, color: '#00C49F' },
];

const processingTimeData = [
    { day: 'Mon', avgTime: 2.3, p99Time: 8.7 },
    { day: 'Tue', avgTime: 2.1, p99Time: 7.9 },
    { day: 'Wed', avgTime: 2.8, p99Time: 9.2 },
    { day: 'Thu', avgTime: 2.5, p99Time: 8.1 },
    { day: 'Fri', avgTime: 2.9, p99Time: 9.8 },
    { day: 'Sat', avgTime: 1.8, p99Time: 6.5 },
    { day: 'Sun', avgTime: 1.6, p99Time: 5.9 },
];

const dailyVolumeData = [
    { day: 'Mon', processed: 45, failed: 2 },
    { day: 'Tue', processed: 52, failed: 1 },
    { day: 'Wed', processed: 38, failed: 3 },
    { day: 'Thu', processed: 67, failed: 2 },
    { day: 'Fri', processed: 89, failed: 4 },
    { day: 'Sat', processed: 23, failed: 1 },
    { day: 'Sun', processed: 18, failed: 0 },
];

const MetricsPage: React.FC = () => {
    const totalPDFs = weeklyProcessingData.reduce((sum, week) => sum + week.totalPDFs, 0);
    const totalWithPII = weeklyProcessingData.reduce((sum, week) => sum + week.withPII, 0);
    const piiPercentage = ((totalWithPII / totalPDFs) * 100).toFixed(1);

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
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                                Total PDFs Processed
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                {totalPDFs.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.8)">
                                Last 6 weeks
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                                PDFs with PII
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                {totalWithPII.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.8)">
                                {piiPercentage}% of total
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                                Avg Processing Time
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                2.3s
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.8)">
                                Per document
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                                P99 Processing Time
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                8.7s
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.8)">
                                99th percentile
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography color="rgba(255,255,255,0.8)" gutterBottom>
                                Success Rate
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                97.2%
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.8)">
                                Processing success
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: 'text.primary' }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Total PII Items
                            </Typography>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                                602
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Sensitive data found
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
                    {/* Weekly Processing Volume */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, height: '100%', boxShadow: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                📈 Weekly PDF Processing Volume
                            </Typography>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={weeklyProcessingData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="withPII" fill="#ff6b6b" name="With PII" />
                                    <Bar dataKey="withoutPII" fill="#4ecdc4" name="Without PII" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* PII Types Distribution */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Paper sx={{ p: 3, height: '100%', boxShadow: 3 }}>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                                🎯 PII Types Detected in Documents
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={piiTypeData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
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
                        </Paper>
                    </Grid>

                    {/* Processing Time Trends */}
                    <Grid item xs={12} lg={6}>
                        <Paper sx={{ p: 3, height: '100%', boxShadow: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                ⏱️ Processing Time Trends (P99 vs Average)
                            </Typography>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={processingTimeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="avgTime" stroke="#8884d8" name="Average Time (s)" strokeWidth={3} />
                                    <Line type="monotone" dataKey="p99Time" stroke="#82ca9d" name="P99 Time (s)" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Daily Volume */}
                    <Grid item xs={12} lg={6}>
                        <Paper sx={{ p: 3, height: '100%', boxShadow: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                📅 Daily Processing Volume
                            </Typography>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={dailyVolumeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="processed" fill="#4ecdc4" name="Processed" />
                                    <Bar dataKey="failed" fill="#ff6b6b" name="Failed" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default MetricsPage; 