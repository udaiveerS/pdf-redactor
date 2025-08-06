import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import AppNavbar from './components/AppNavbar';
import SideMenu from './components/SideMenu';
import HomePage from './pages/HomePage';
import PDFPage from './pages/PDFPage';
import MetricsPage from './pages/MetricsPage';
import AppTheme from './shared-theme/AppTheme';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <SideMenu />
        <AppNavbar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundColor: 'background.default',
            overflow: 'auto',
            mt: { xs: 8, md: 0 },
          }}
        >
          {children}
        </Box>
      </Box>
    </AppTheme>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/pdf" replace />} />
          <Route path="/pdf" element={<PDFPage />} />
          <Route path="/metrics" element={<MetricsPage />} />
          <Route path="*" element={<Navigate to="/pdf" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

export default App; 