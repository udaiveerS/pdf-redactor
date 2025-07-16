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
    // All routes now go to tasks/projects
    return [
      { text: 'Dashboard', isActive: false },
      { text: 'Projects', isActive: true }
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
