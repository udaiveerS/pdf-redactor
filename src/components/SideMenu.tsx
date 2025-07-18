import * as React from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SelectContent from './SelectContent';
import MenuContent from './MenuContent';
import CardAlert from './CardAlert';
import OptionsMenu from './OptionsMenu';
import { useEffect, useState } from 'react';


const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

declare global {
  interface Window {
    __COLAB_CLIENT_ID?: string;
  }
}

export default function SideMenu(props: any) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [port, setPort] = useState<string>(window.location.port);

  // Listen for clientId from WebSocket handshake (assume you have a way to get it)
  useEffect(() => {
      // If you have a global or context for WebSocket, subscribe to clientId updates
      // For example, if you use a custom hook or context:
      if (window.__COLAB_CLIENT_ID) {
          setClientId(window.__COLAB_CLIENT_ID);
      } else {
          // fallback: show unknown
          setClientId(null);
      }
  }, []);

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          mt: 'calc(var(--template-frame-height, 0px) + 4px)',
          p: 1.5,
        }}
      >
        <SelectContent />
      </Box>
      <Divider />
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MenuContent />
        <CardAlert />
      </Box>
      {/* Client Info */}
      <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
              Client ID: {clientId || 'unknown'}<br />
              Port: {port}
          </Typography>
      </Box>
      <Stack
        direction="row"
        sx={{
          p: 2,
          gap: 1,
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Avatar
          sizes="small"
          sx={{ width: 36, height: 36 }}
        >
          C
        </Avatar>
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>
            {process.env.REACT_APP_CLIENT_ID || 'client-1'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Port: {process.env.REACT_APP_PORT || '8080'}
          </Typography>
        </Box>
        <OptionsMenu />
      </Stack>
    </Drawer>
  );
}
