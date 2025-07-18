import React from 'react';
import { Box, Typography, Chip, Avatar, Tooltip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

interface ClientIdentifierProps {
  clientId?: string;
  port?: string;
}

const ClientIdentifier: React.FC<ClientIdentifierProps> = ({ 
  clientId = 'client-1', 
  port = '8080' 
}) => {
  // Debug information
  const debugInfo = {
    REACT_APP_CLIENT_ID: process.env.REACT_APP_CLIENT_ID,
    REACT_APP_PORT: process.env.REACT_APP_PORT,
    NODE_ENV: process.env.NODE_ENV,
    windowLocation: window.location.href,
    windowPort: window.location.port
  };

  return (
    <Tooltip 
      title={
        <Box>
          <Typography variant="body2">Debug Info:</Typography>
          <Typography variant="caption" component="div">
            REACT_APP_CLIENT_ID: {debugInfo.REACT_APP_CLIENT_ID || 'undefined'}
          </Typography>
          <Typography variant="caption" component="div">
            REACT_APP_PORT: {debugInfo.REACT_APP_PORT || 'undefined'}
          </Typography>
          <Typography variant="caption" component="div">
            Window Port: {debugInfo.windowPort || 'undefined'}
          </Typography>
        </Box>
      }
      arrow
    >
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 2,
          padding: 1.5,
          backdropFilter: 'blur(10px)',
          minWidth: 200,
          cursor: 'help',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            <PersonIcon />
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" color="white" sx={{ fontWeight: 600 }}>
              {clientId}
            </Typography>
            <Typography variant="caption" color="white" sx={{ opacity: 0.8 }}>
              Port: {port}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
};

export default ClientIdentifier; 