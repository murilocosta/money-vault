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
import { loginAction } from '@/app/actions/auth';
import type { ActionResult } from '@/types';

const initialState: ActionResult = { success: true, data: undefined };

export function LoginForm({ registered }: { registered?: boolean }) {
  const [state, action, isPending] = useActionState(loginAction, initialState);

  return (
    <Box
      component="form"
      action={action}
      className="flex flex-col gap-5 w-full max-w-sm"
    >
      <div className="text-center">
        <Typography variant="h5" className="font-bold">
          Sign in to Money Vault
        </Typography>
        <Typography variant="body2" color="text.secondary" className="mt-1">
          Manage your finances in one place
        </Typography>
      </div>

      {registered && (
        <Alert severity="success">Account created! You can now sign in.</Alert>
      )}

      {state && !state.success && (
        <Alert severity="error">{state.error}</Alert>
      )}

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
        autoComplete="current-password"
        required
        fullWidth
        size="small"
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={isPending}
        className="h-10"
      >
        {isPending ? <CircularProgress size={20} color="inherit" /> : 'Sign in'}
      </Button>

      <Divider />

      <Typography variant="body2" align="center" color="text.secondary">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-indigo-600 font-medium hover:underline">
          Create one
        </Link>
      </Typography>
    </Box>
  );
}
