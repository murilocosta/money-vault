'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import { registerAction } from '@/app/actions/auth';
import type { ActionResult } from '@/types';

const initialState: ActionResult = { success: true, data: undefined };

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, initialState);

  return (
    <Box
      component="form"
      action={action}
      className="flex flex-col gap-5 w-full max-w-sm"
    >
      <div className="text-center">
        <Typography variant="h5" className="font-bold">
          Create your account
        </Typography>
        <Typography variant="body2" color="text.secondary" className="mt-1">
          Start tracking your finances today
        </Typography>
      </div>

      {state && !state.success && (
        <Alert severity="error">{state.error}</Alert>
      )}

      <TextField
        name="name"
        label="Full name"
        type="text"
        autoComplete="name"
        required
        fullWidth
        size="small"
      />

      <TextField
        name="email"
        label="Email address"
        type="email"
        autoComplete="email"
        required
        fullWidth
        size="small"
      />

      <TextField
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        fullWidth
        size="small"
        helperText="Minimum 8 characters"
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={isPending}
        className="h-10"
      >
        {isPending ? <CircularProgress size={20} color="inherit" /> : 'Create account'}
      </Button>

      <Divider />

      <Typography variant="body2" align="center" color="text.secondary">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-600 font-medium hover:underline">
          Sign in
        </Link>
      </Typography>
    </Box>
  );
}
