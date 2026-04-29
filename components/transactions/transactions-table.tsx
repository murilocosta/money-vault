'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Pagination,
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
import { TransactionFormDialog } from './transaction-form-dialog';
import { deleteTransactionAction } from '@/app/actions/transactions';

const TYPE_CHIP: Record<string, { label: string; color: 'success' | 'error' | 'info' }> = {
  INCOME:   { label: 'Income',   color: 'success' },
  EXPENSE:  { label: 'Expense',  color: 'error'   },
  TRANSFER: { label: 'Transfer', color: 'info'    },
};

interface SelectOption { id: string; name: string }
interface CategoryOption extends SelectOption { icon: string | null; color: string | null }

interface Transaction {
  id: string;
  date: string;
  amount: string;
  type: string;
  description: string;
  notes: string | null;
  accountId: string;
  categoryId: string | null;
  payeeId: string | null;
  account:  { id: string; name: string; currency: string };
  category: { id: string; name: string; icon: string | null; color: string | null } | null;
  payee:    { id: string; name: string } | null;
}

interface Props {
  transactions: Transaction[];
  pageCount: number;
  currentPage: number;
  total: number;
  accounts: SelectOption[];
  categories: CategoryOption[];
  payees: SelectOption[];
}

function fmt(amount: string, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function TransactionsTable({
  transactions,
  pageCount,
  currentPage,
  total,
  accounts,
  categories,
  payees,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | undefined>(undefined);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditTarget(t);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTransactionAction(id);
      if (!result.success) setSnackbar(result.error);
    });
  }

  function handlePageChange(_: React.ChangeEvent<unknown>, page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`?${params.toString()}`);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Transactions</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-0.5">
            {total} transaction{total !== 1 ? 's' : ''} total
          </Typography>
        </div>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} size="small">
          New transaction
        </Button>
      </div>

      {transactions.length === 0 ? (
        <Box className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <Typography variant="h6" color="text.secondary">No transactions yet</Typography>
          <Typography variant="body2" color="text.secondary">
            Record your first transaction to start tracking your finances.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} className="mt-2">
            Add transaction
          </Button>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.50' } }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Payee</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => {
                  const chip = TYPE_CHIP[tx.type] ?? { label: tx.type, color: 'info' as const };
                  return (
                    <TableRow key={tx.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                          {fmtDate(tx.date)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {tx.description}
                        </Typography>
                        {tx.notes && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                          >
                            {tx.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={chip.label} color={chip.color} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{tx.account.name}</Typography>
                      </TableCell>
                      <TableCell>
                        {tx.category ? (
                          <div className="flex items-center gap-1">
                            {tx.category.color && (
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: tx.category.color }}
                              />
                            )}
                            <Typography variant="body2">
                              {tx.category.icon ? `${tx.category.icon} ` : ''}{tx.category.name}
                            </Typography>
                          </div>
                        ) : (
                          <Typography variant="body2" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={tx.payee ? 'text.primary' : 'text.disabled'}>
                          {tx.payee?.name ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                          color={tx.type === 'INCOME' ? 'success.main' : tx.type === 'EXPENSE' ? 'error.main' : 'text.primary'}
                        >
                          {tx.type === 'EXPENSE' ? '−' : tx.type === 'INCOME' ? '+' : ''}
                          {fmt(tx.amount, tx.account.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(tx)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            disabled={isPending}
                            onClick={() => handleDelete(tx.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {pageCount > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                count={pageCount}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
            </div>
          )}
        </>
      )}

      <TransactionFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        transaction={editTarget}
        accounts={accounts}
        categories={categories}
        payees={payees}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setSnackbar(null)}>{snackbar}</Alert>
      </Snackbar>
    </>
  );
}
