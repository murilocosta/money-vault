'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createCategory, deleteCategory, updateCategory } from '@/lib/services/category.service';
import { requireUserId } from '@/lib/dal';
import type { ActionResult } from '@/types';

const CategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color').optional().or(z.literal('')),
  icon: z.string().max(2).optional().or(z.literal('')),
});

function nullableString(val: FormDataEntryValue | null): string | null {
  if (!val || (val as string).trim() === '') return null;
  return val as string;
}

export async function createCategoryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = CategorySchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
    icon: formData.get('icon'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, color, icon } = parsed.data;
  await createCategory(userId, { name, color: color || undefined, icon: icon || undefined });
  revalidatePath('/dashboard/categories');
  return { success: true, data: undefined };
}

export async function updateCategoryAction(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = CategorySchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
    icon: formData.get('icon'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, color } = parsed.data;
  await updateCategory(id, userId, {
    name,
    color: color || null,
    icon: nullableString(formData.get('icon')),
  });
  revalidatePath('/dashboard/categories');
  return { success: true, data: undefined };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await deleteCategory(id, userId);
  revalidatePath('/dashboard/categories');
  return { success: true, data: undefined };
}
