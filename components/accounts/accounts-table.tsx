'use client';

import { useState, useTransition } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { AccountFormDialog } from './account-form-dialog';
import { deleteAccountAction } from '@/app/actions/accounts';

const TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CREDIT_CARD: 'Credit Card',
  LOAN: 'Loan',
};

const TYPE_COLORS: Record<string, 'default' | 'primary' | 'warning' | 'error'> = {
  CHECKING: 'primary',
  SAVINGS: 'default',
  CREDIT_CARD: 'warning',
  LOAN: 'error',
};

interface Account {
  id: string;
  name: string;
  type: string;
  balance: string | number;
  currency: string;
  description: string | null;
  isActive: boolean;
}

interface Props {
  accounts: Account[];
}

export function AccountsTable({ accounts }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | undefined>(undefined);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(account: Account) {
    setEditTarget(account);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAccountAction(id);
      if (!result.success) setSnackbar(result.error);
    });
  }

  const fmt = (balance: string | number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
      Number(balance),
    );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mt-0.5">
            Manage your financial accounts
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          size="small"
        >
          New account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Box className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <Typography variant="h6" color="text.secondary">
            No accounts yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add your first account to start tracking your finances.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} className="mt-2">
            Add account
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.50' } }}>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {account.name}
                    </Typography>
                    {account.description && (
                      <Typography variant="caption" color="text.secondary">
                        {account.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={TYPE_LABELS[account.type] ?? account.type}
                      color={TYPE_COLORS[account.type] ?? 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{account.currency}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600 }}
                      color={Number(account.balance) < 0 ? 'error.main' : 'text.primary'}
                    >
                      {fmt(account.balance, account.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={account.isActive ? 'Active' : 'Inactive'}
                      color={account.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(account)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        disabled={isPending}
                        onClick={() => handleDelete(account.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AccountFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        account={editTarget}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setSnackbar(null)}>
          {snackbar}
        </Alert>
      </Snackbar>
    </>
  );
}
