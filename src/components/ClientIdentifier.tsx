import React from 'react';
import { Box, Typography, Chip, Avatar } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

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
        padding: 1.5,
        backdropFilter: 'blur(10px)',
        minWidth: 200,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
          <PersonIcon />
        </Avatar>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" color="white" sx={{ fontWeight: 600 }}>
            Riley Carter
          </Typography>
          <Typography variant="caption" color="white" sx={{ opacity: 0.8 }}>
            riley@email.com
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ClientIdentifier; 