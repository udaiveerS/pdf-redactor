import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

interface ClientIdentifierProps {
  clientId?: string;
  port?: string;
}

const ClientIdentifier: React.FC<ClientIdentifierProps> = ({ 
  clientId = 'client-1', 
  port = '8080' 
}) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 2,
        padding: 1,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={clientId}
          size="small"
          color="primary"
          variant="filled"
        />
        <Typography variant="caption" color="white">
          Port: {port}
        </Typography>
      </Box>
    </Box>
  );
};

export default ClientIdentifier; 