'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAccount, deleteAccount, updateAccount } from '@/lib/services/account.service';
import { requireUserId } from '@/lib/dal';
import type { ActionResult } from '@/types';

const AccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'LOAN']),
  balance: z.coerce.number(),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  description: z.string().optional(),
});

export async function createAccountAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = AccountSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    balance: formData.get('balance'),
    currency: formData.get('currency'),
    description: formData.get('description') || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await createAccount(userId, parsed.data);
  revalidatePath('/dashboard/accounts');
  return { success: true, data: undefined };
}

export async function updateAccountAction(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = AccountSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    balance: formData.get('balance'),
    currency: formData.get('currency'),
    description: formData.get('description') || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await updateAccount(id, userId, parsed.data);
  revalidatePath('/dashboard/accounts');
  return { success: true, data: undefined };
}

export async function deleteAccountAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await deleteAccount(id, userId);
  revalidatePath('/dashboard/accounts');
  return { success: true, data: undefined };
}
