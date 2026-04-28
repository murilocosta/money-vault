'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/lib/services/category.service';
import type { ActionResult } from '@/types';

const CategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color').optional().or(z.literal('')),
  icon: z.string().max(2).optional().or(z.literal('')),
});

function toOptional(val: FormDataEntryValue | null): string | undefined {
  if (!val || val === '') return undefined;
  return val as string;
}

export async function createCategoryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = CategorySchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
    icon: formData.get('icon'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, color, icon } = parsed.data;
  await createCategory({ name, color: color || undefined, icon: icon || undefined });
  revalidatePath('/dashboard/categories');
  return { success: true, data: undefined };
}

export async function updateCategoryAction(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = CategorySchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
    icon: formData.get('icon'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, color } = parsed.data;
  await updateCategory(id, {
    name,
    color: color || null,
    icon: toOptional(formData.get('icon')) ?? null,
  });
  revalidatePath('/dashboard/categories');
  return { success: true, data: undefined };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  await deleteCategory(id);
  revalidatePath('/dashboard/categories');
  return { success: true, data: undefined };
}
