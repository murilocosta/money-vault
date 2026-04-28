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
import { createAccountAction, updateAccountAction } from '@/app/actions/accounts';
import type { ActionResult } from '@/types';

const ACCOUNT_TYPES = [
  { value: 'CHECKING', label: 'Checking' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'LOAN', label: 'Loan' },
];

const CURRENCIES = ['EUR', 'USD', 'BRL'];

interface Account {
  id: string;
  name: string;
  type: string;
  balance: string | number;
  currency: string;
  description: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  account?: Account;
}

const initialState: ActionResult = { success: true, data: undefined };

export function AccountFormDialog({ open, onClose, account }: Props) {
  const isEdit = !!account;

  const boundUpdateAction = account
    ? updateAccountAction.bind(null, account.id)
    : null;

  const action = isEdit ? boundUpdateAction! : createAccountAction;

  const [state, formAction, isPending] = useActionState(action, initialState);
  const submitted = useRef(false);

  useEffect(() => {
    if (isPending) submitted.current = true;
    if (submitted.current && !isPending && state.success) {
      submitted.current = false;
      onClose();
    }
  }, [state, isPending, onClose]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{isEdit ? 'Edit Account' : 'New Account'}</DialogTitle>

      <form action={formAction}>
        <DialogContent className="flex flex-col gap-4 pt-2">
          {!state.success && <Alert severity="error">{state.error}</Alert>}

          <TextField
            name="name"
            label="Account name"
            required
            fullWidth
            size="small"
            defaultValue={account?.name ?? ''}
          />

          <FormControl fullWidth size="small" required>
            <InputLabel>Type</InputLabel>
            <Select name="type" label="Type" defaultValue={account?.type ?? 'CHECKING'}>
              {ACCOUNT_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            name="balance"
            label="Initial balance"
            type="number"
            slotProps={{ htmlInput: { step: '0.01' } }}
            required
            fullWidth
            size="small"
            defaultValue={account ? Number(account.balance).toFixed(2) : '0.00'}
          />

          <FormControl fullWidth size="small" required>
            <InputLabel>Currency</InputLabel>
            <Select name="currency" label="Currency" defaultValue={account?.currency ?? 'EUR'}>
              {CURRENCIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            name="description"
            label="Description (optional)"
            fullWidth
            size="small"
            multiline
            rows={2}
            defaultValue={account?.description ?? ''}
          />
        </DialogContent>

        <DialogActions className="px-6 pb-4">
          <Button onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? (
              <CircularProgress size={18} color="inherit" />
            ) : isEdit ? (
              'Save changes'
            ) : (
              'Create'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
