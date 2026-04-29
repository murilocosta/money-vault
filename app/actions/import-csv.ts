'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUserId } from '@/lib/dal';
import type { ActionResult } from '@/types';

const ImportRowSchema = z.object({
  date:        z.string().date(),
  amount:      z.number(),
  type:        z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  description: z.string().min(1),
  payeeName:   z.string().min(1),
  categoryId:  z.string().optional(),
});

const ImportPayloadSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  rows:      z.array(ImportRowSchema).min(1, 'No rows to import'),
});

export type ImportRow = z.infer<typeof ImportRowSchema>;

export async function importCsvAction(
  payload: { accountId: string; rows: ImportRow[] },
): Promise<ActionResult<{ imported: number }>> {
  const userId = await requireUserId();

  const parsed = ImportPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { accountId, rows } = parsed.data;

  const account = await prisma.account.findUnique({ where: { id: accountId, userId } });
  if (!account) return { success: false, error: 'Account not found' };

  let imported = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      // Upsert payee by name (unique per user)
      const payee = await tx.payee.upsert({
        where:  { userId_name: { userId, name: row.payeeName } },
        update: {},
        create: { userId, name: row.payeeName, type: 'OTHER' },
      });

      await tx.transaction.create({
        data: {
          userId,
          accountId,
          date:        new Date(row.date),
          amount:      row.amount,
          type:        row.type,
          description: row.description,
          payeeId:     payee.id,
          categoryId:  row.categoryId ?? null,
          isImported:  true,
        },
      });

      imported++;
    }
  });

  revalidatePath('/dashboard/transactions');
  return { success: true, data: { imported } };
}
