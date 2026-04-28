'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createUser, getUserByEmail, verifyPassword } from '@/lib/services/user.service';
import type { ActionResult } from '@/types';

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const LoginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function registerAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const { name, email, password } = parsed.data;

  const existing = await getUserByEmail(email);
  if (existing) {
    return { success: false, error: 'An account with that email already exists.' };
  }

  await createUser(name, email, password);
  redirect('/login?registered=1');
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const { email, password } = parsed.data;

  const user = await getUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: 'Invalid email or password.' };
  }

  redirect('/dashboard');
}
