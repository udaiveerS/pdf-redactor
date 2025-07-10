import * as React from 'react';
import { styled } from '@mui/material/styles';
import MuiMenuItem from '@mui/material/MenuItem';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import MenuButton from './MenuButton';

const MenuItem = styled(MuiMenuItem)({
  margin: '2px 0',
});

export default function OptionsMenu() {
  return (
    <MenuButton
      aria-label="Open menu"
      onClick={() => {}} // Empty function to make it clickable but do nothing
      sx={{ borderColor: 'transparent' }}
    >
      <MoreVertRoundedIcon />
    </MenuButton>
  );
}
