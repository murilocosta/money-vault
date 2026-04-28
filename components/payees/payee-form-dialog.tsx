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
import { createPayeeAction, updatePayeeAction } from '@/app/actions/payees';
import type { ActionResult } from '@/types';

const PAYEE_TYPES = [
  { value: 'PERSON', label: 'Person' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'INSTITUTION', label: 'Institution' },
  { value: 'OTHER', label: 'Other' },
];

interface Payee {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  payee?: Payee;
}

const initialState: ActionResult = { success: true, data: undefined };

export function PayeeFormDialog({ open, onClose, payee }: Props) {
  const isEdit = !!payee;

  const action = isEdit
    ? updatePayeeAction.bind(null, payee.id)
    : createPayeeAction;

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
      <DialogTitle>{isEdit ? 'Edit Payee' : 'New Payee'}</DialogTitle>

      <form action={formAction}>
        <DialogContent className="flex flex-col gap-4 pt-2">
          {!state.success && <Alert severity="error">{state.error}</Alert>}

          <TextField
            name="name"
            label="Name"
            required
            fullWidth
            size="small"
            defaultValue={payee?.name ?? ''}
          />

          <FormControl fullWidth size="small" required>
            <InputLabel>Type</InputLabel>
            <Select name="type" label="Type" defaultValue={payee?.type ?? 'PERSON'}>
              {PAYEE_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            name="email"
            label="Email (optional)"
            type="email"
            fullWidth
            size="small"
            defaultValue={payee?.email ?? ''}
          />

          <TextField
            name="phone"
            label="Phone (optional)"
            type="tel"
            fullWidth
            size="small"
            defaultValue={payee?.phone ?? ''}
          />

          <TextField
            name="notes"
            label="Notes (optional)"
            fullWidth
            size="small"
            multiline
            rows={2}
            defaultValue={payee?.notes ?? ''}
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
