'use client';

import { useActionState, useEffect, useRef } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { createTransactionAction, updateTransactionAction } from '@/app/actions/transactions';
import type { ActionResult } from '@/types';

const TRANSACTION_TYPES = [
  { value: 'INCOME',   label: 'Income' },
  { value: 'EXPENSE',  label: 'Expense' },
  { value: 'TRANSFER', label: 'Transfer' },
];

interface SelectOption { id: string; name: string }
interface CategoryOption extends SelectOption { icon: string | null }

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
}

interface Props {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction;
  accounts: SelectOption[];
  categories: CategoryOption[];
  payees: SelectOption[];
}

const initialState: ActionResult = { success: true, data: undefined };

export function TransactionFormDialog({
  open,
  onClose,
  transaction,
  accounts,
  categories,
  payees,
}: Props) {
  const isEdit = !!transaction;

  const action = isEdit
    ? updateTransactionAction.bind(null, transaction.id)
    : createTransactionAction;

  const [state, formAction, isPending] = useActionState(action, initialState);
  const submitted = useRef(false);

  useEffect(() => {
    if (isPending) submitted.current = true;
    if (submitted.current && !isPending && state.success) {
      submitted.current = false;
      onClose();
    }
  }, [state, isPending, onClose]);

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>

      <form action={formAction}>
        <DialogContent className="flex flex-col gap-4 pt-2">
          {!state.success && <Alert severity="error">{state.error}</Alert>}

          {/* Row: date + type */}
          <div className="flex gap-3">
            <TextField
              name="date"
              label="Date"
              type="date"
              required
              size="small"
              className="flex-1"
              defaultValue={transaction?.date ?? todayIso}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <FormControl size="small" required className="flex-1">
              <InputLabel>Type</InputLabel>
              <Select name="type" label="Type" defaultValue={transaction?.type ?? 'EXPENSE'}>
                {TRANSACTION_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* Amount */}
          <TextField
            name="amount"
            label="Amount"
            type="number"
            required
            fullWidth
            size="small"
            defaultValue={transaction?.amount ?? ''}
            slotProps={{ htmlInput: { step: '0.01', min: '0.01' } }}
          />

          {/* Description */}
          <TextField
            name="description"
            label="Description"
            required
            fullWidth
            size="small"
            defaultValue={transaction?.description ?? ''}
          />

          {/* Account (mandatory) */}
          <FormControl fullWidth size="small" required>
            <InputLabel>Account</InputLabel>
            <Select
              name="accountId"
              label="Account"
              defaultValue={transaction?.accountId ?? (accounts[0]?.id ?? '')}
            >
              {accounts.map((a) => (
                <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Category (optional) */}
          <FormControl fullWidth size="small">
            <InputLabel>Category (optional)</InputLabel>
            <Select
              name="categoryId"
              label="Category (optional)"
              defaultValue={transaction?.categoryId ?? ''}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.icon ? `${c.icon} ` : ''}{c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Payee (optional) */}
          <FormControl fullWidth size="small">
            <InputLabel>Payee (optional)</InputLabel>
            <Select
              name="payeeId"
              label="Payee (optional)"
              defaultValue={transaction?.payeeId ?? ''}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {payees.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Notes */}
          <TextField
            name="notes"
            label="Notes (optional)"
            fullWidth
            size="small"
            multiline
            rows={2}
            defaultValue={transaction?.notes ?? ''}
          />
        </DialogContent>

        <DialogActions className="px-6 pb-4">
          <Button onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending
              ? <CircularProgress size={18} color="inherit" />
              : isEdit ? 'Save changes' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
