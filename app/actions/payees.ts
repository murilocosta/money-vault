'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createPayee, deletePayee, updatePayee } from '@/lib/services/payee.service';
import { requireUserId } from '@/lib/dal';
import type { ActionResult } from '@/types';

const PayeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['PERSON', 'BUSINESS', 'INSTITUTION', 'OTHER']),
  email: z.email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

function nullableString(val: FormDataEntryValue | null): string | null {
  if (!val || (val as string).trim() === '') return null;
  return val as string;
}

export async function createPayeeAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = PayeeSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, type, email, phone, notes } = parsed.data;
  await createPayee(userId, {
    name,
    type,
    email: email || undefined,
    phone: phone || undefined,
    notes: notes || undefined,
  });
  revalidatePath('/dashboard/payees');
  return { success: true, data: undefined };
}

export async function updatePayeeAction(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = PayeeSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, type } = parsed.data;
  await updatePayee(id, userId, {
    name,
    type,
    email: nullableString(formData.get('email')),
    phone: nullableString(formData.get('phone')),
    notes: nullableString(formData.get('notes')),
  });
  revalidatePath('/dashboard/payees');
  return { success: true, data: undefined };
}

export async function deletePayeeAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await deletePayee(id, userId);
  revalidatePath('/dashboard/payees');
  return { success: true, data: undefined };
}
