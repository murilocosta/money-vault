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
  TextField,
} from '@mui/material';
import { createCategoryAction, updateCategoryAction } from '@/app/actions/categories';
import type { ActionResult } from '@/types';

interface Category {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  category?: Category;
}

const initialState: ActionResult = { success: true, data: undefined };

export function CategoryFormDialog({ open, onClose, category }: Props) {
  const isEdit = !!category;

  const action = isEdit
    ? updateCategoryAction.bind(null, category.id)
    : createCategoryAction;

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
      <DialogTitle>{isEdit ? 'Edit Category' : 'New Category'}</DialogTitle>

      <form action={formAction}>
        <DialogContent className="flex flex-col gap-4 pt-2">
          {!state.success && <Alert severity="error">{state.error}</Alert>}

          <TextField
            name="name"
            label="Category name"
            required
            fullWidth
            size="small"
            defaultValue={category?.name ?? ''}
          />

          <TextField
            name="icon"
            label="Icon (emoji, optional)"
            fullWidth
            size="small"
            defaultValue={category?.icon ?? ''}
            placeholder="e.g. 🍔"
            slotProps={{ htmlInput: { maxLength: 2 } }}
          />

          <TextField
            name="color"
            label="Color (optional)"
            type="color"
            fullWidth
            size="small"
            defaultValue={category?.color ?? '#4f46e5'}
            slotProps={{ htmlInput: { style: { height: 32, cursor: 'pointer' } } }}
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
