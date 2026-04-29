'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '@/lib/services/transaction.service';
import { requireUserId } from '@/lib/dal';
import type { ActionResult } from '@/types';

const TransactionSchema = z.object({
  date: z.string().date('Invalid date'),
  amount: z.coerce.number({ error: 'Amount must be a number' }).positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional().or(z.literal('')),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().optional().or(z.literal('')),
  payeeId: z.string().optional().or(z.literal('')),
});

function nullable(val: FormDataEntryValue | null): string | null {
  if (!val || (val as string).trim() === '') return null;
  return val as string;
}

export async function createTransactionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = TransactionSchema.safeParse({
    date:        formData.get('date'),
    amount:      formData.get('amount'),
    type:        formData.get('type'),
    description: formData.get('description'),
    notes:       formData.get('notes'),
    accountId:   formData.get('accountId'),
    categoryId:  formData.get('categoryId'),
    payeeId:     formData.get('payeeId'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { date, amount, type, description, notes, accountId, categoryId, payeeId } = parsed.data;

  await createTransaction(userId, {
    date: new Date(date),
    amount,
    type,
    description,
    notes: notes || undefined,
    accountId,
    categoryId: categoryId || undefined,
    payeeId: payeeId || undefined,
  });

  revalidatePath('/dashboard/transactions');
  return { success: true, data: undefined };
}

export async function updateTransactionAction(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = TransactionSchema.safeParse({
    date:        formData.get('date'),
    amount:      formData.get('amount'),
    type:        formData.get('type'),
    description: formData.get('description'),
    notes:       formData.get('notes'),
    accountId:   formData.get('accountId'),
    categoryId:  formData.get('categoryId'),
    payeeId:     formData.get('payeeId'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { date, amount, type, description, accountId } = parsed.data;

  await updateTransaction(id, userId, {
    date: new Date(date),
    amount,
    type,
    description,
    notes:      nullable(formData.get('notes')),
    accountId,
    categoryId: nullable(formData.get('categoryId')),
    payeeId:    nullable(formData.get('payeeId')),
  });

  revalidatePath('/dashboard/transactions');
  return { success: true, data: undefined };
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await deleteTransaction(id, userId);
  revalidatePath('/dashboard/transactions');
  return { success: true, data: undefined };
}
