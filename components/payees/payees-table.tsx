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
import { PayeeFormDialog } from './payee-form-dialog';
import { deletePayeeAction } from '@/app/actions/payees';

const TYPE_LABELS: Record<string, string> = {
  PERSON: 'Person',
  BUSINESS: 'Business',
  INSTITUTION: 'Institution',
  OTHER: 'Other',
};

const TYPE_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'warning'> = {
  PERSON: 'primary',
  BUSINESS: 'secondary',
  INSTITUTION: 'warning',
  OTHER: 'default',
};

interface Payee {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

export function PayeesTable({ payees }: { payees: Payee[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Payee | undefined>(undefined);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(payee: Payee) {
    setEditTarget(payee);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deletePayeeAction(id);
      if (!result.success) setSnackbar(result.error);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Payees
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mt-0.5">
            Manage the people and entities linked to your transactions
          </Typography>
        </div>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} size="small">
          New payee
        </Button>
      </div>

      {payees.length === 0 ? (
        <Box className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <Typography variant="h6" color="text.secondary">
            No payees yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add payees to associate them with your transactions.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} className="mt-2">
            Add payee
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.50' } }}>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payees.map((payee) => (
                <TableRow key={payee.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {payee.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={TYPE_LABELS[payee.type] ?? payee.type}
                      color={TYPE_COLORS[payee.type] ?? 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {payee.email ? (
                      <Typography
                        component="a"
                        href={`mailto:${payee.email}`}
                        variant="body2"
                        color="primary"
                        sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {payee.email}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={payee.phone ? 'text.primary' : 'text.disabled'}>
                      {payee.phone ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography
                      variant="body2"
                      color={payee.notes ? 'text.secondary' : 'text.disabled'}
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {payee.notes ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(payee)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        disabled={isPending}
                        onClick={() => handleDelete(payee.id)}
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

      <PayeeFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        payee={editTarget}
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
