'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CategoryIcon from '@mui/icons-material/Category';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { logoutAction } from '@/app/actions/auth';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard',    href: '/dashboard',              icon: <DashboardIcon fontSize="small" /> },
  { label: 'Transactions', href: '/dashboard/transactions', icon: <ReceiptLongIcon fontSize="small" /> },
  { label: 'Accounts',     href: '/dashboard/accounts',     icon: <AccountBalanceWalletIcon fontSize="small" /> },
  { label: 'Categories',   href: '/dashboard/categories',   icon: <CategoryIcon fontSize="small" /> },
  { label: 'Payees',       href: '/dashboard/payees',       icon: <PeopleIcon fontSize="small" /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box className="flex items-center gap-2 px-4 py-5 border-b border-slate-100">
        <AccountBalanceWalletIcon color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }} color="primary">
          Money Vault
        </Typography>
      </Box>

      <List disablePadding className="px-2 pt-2">
        {navItems.map(({ label, href, icon }) => {
          const active = pathname === href;
          return (
            <ListItem key={href} disablePadding className="mb-1">
              <ListItemButton
                component={Link}
                href={href}
                selected={active}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'white' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
                <ListItemText
                  primary={label}
                  slotProps={{ primary: { style: { fontSize: 14, fontWeight: active ? 600 : 400 } } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box className="mt-auto px-2 pb-4">
        <form action={logoutAction}>
          <ListItemButton
            component="button"
            type="submit"
            sx={{ borderRadius: 2, width: '100%', color: 'text.secondary' }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              slotProps={{ primary: { style: { fontSize: 14 } } }}
            />
          </ListItemButton>
        </form>
      </Box>
    </Drawer>
  );
}
