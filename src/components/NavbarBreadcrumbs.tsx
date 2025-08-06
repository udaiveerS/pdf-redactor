import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Breadcrumbs, { breadcrumbsClasses } from '@mui/material/Breadcrumbs';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  [`& .${breadcrumbsClasses.separator}`]: {
    color: (theme.vars || theme).palette.action.disabled,
    margin: 1,
  },
  [`& .${breadcrumbsClasses.ol}`]: {
    alignItems: 'center',
  },
}));

export default function NavbarBreadcrumbs() {
  const location = useLocation();
  
  const getBreadcrumbItems = () => {
    const path = location.pathname;
    if (path === '/pdf') {
      return [
        { text: 'PDF Redactor', isActive: false },
        { text: 'Upload & Process', isActive: true }
      ];
    } else if (path === '/metrics') {
      return [
        { text: 'PDF Redactor', isActive: false },
        { text: 'Analytics', isActive: true }
      ];
    }
    return [
      { text: 'PDF Redactor', isActive: false },
      { text: 'Dashboard', isActive: true }
    ];
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRoundedIcon fontSize="small" />}
    >
      {breadcrumbItems.map((item, index) => (
        <Typography 
          key={index}
          variant="body1" 
          sx={{ 
            color: item.isActive ? 'text.primary' : 'text.secondary',
            fontWeight: item.isActive ? 600 : 400
          }}
        >
          {item.text}
        </Typography>
      ))}
    </StyledBreadcrumbs>
  );
}
