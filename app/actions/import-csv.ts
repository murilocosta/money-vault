'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireUserId } from '@/lib/dal';
import type { ActionResult } from '@/types';

const IMPORT_BATCH_SIZE = 10;

const ImportRowSchema = z.object({
  date: z.coerce.date(),
  amount: z.number(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  description: z.string().min(1),
  payeeName: z.string().min(1),
  categoryId: z.string().optional(),
});

const ImportPayloadSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  rows: z.array(ImportRowSchema).min(1, 'No rows to import'),
});

export type ImportRow = z.infer<typeof ImportRowSchema>;

async function processBatch(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  accountId: string,
  batch: ImportRow[],
) {
  const uniquePayeeNames = [...new Set(batch.map((r) => r.payeeName))];
  await Promise.all(
    uniquePayeeNames.map((name) =>
      tx.payee.upsert({
        where: { userId_name: { userId, name } },
        update: {},
        create: { userId, name, type: 'OTHER' },
      }),
    ),
  );

  const payees = await tx.payee.findMany({
    where: { userId, name: { in: uniquePayeeNames } },
    select: { id: true, name: true },
  });
  const payeeMap = new Map(payees.map((p) => [p.name, p.id]));

  await tx.transaction.createMany({
    data: batch.map((row) => ({
      userId,
      accountId,
      date: row.date,
      amount: row.amount,
      type: row.type,
      description: row.description,
      payeeId: payeeMap.get(row.payeeName)!,
      categoryId: row.categoryId ?? null,
      isImported: true,
    })),
  });
}

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

  for (let i = 0; i < rows.length; i += IMPORT_BATCH_SIZE) {
    const batch = rows.slice(i, i + IMPORT_BATCH_SIZE);
    await prisma.$transaction((tx) => processBatch(tx, userId, accountId, batch), { maxWait: 20000 });
    imported += batch.length;
  }

  revalidatePath('/dashboard/transactions');
  return { success: true, data: { imported } };
}

const ImportBatchSchema = z.object({
  accountId: z.string().min(1),
  batch: z.array(ImportRowSchema).min(1),
});

export async function importCsvBatchAction(
  payload: { accountId: string; batch: ImportRow[] },
): Promise<ActionResult<{ imported: number }>> {
  const userId = await requireUserId();

  const parsed = ImportBatchSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { accountId, batch } = parsed.data;

  const account = await prisma.account.findUnique({ where: { id: accountId, userId } });
  if (!account) return { success: false, error: 'Account not found' };

  await prisma.$transaction((tx) => processBatch(tx, userId, accountId, batch), { maxWait: 20000 });

  return { success: true, data: { imported: batch.length } };
}

export async function revalidateAfterImport(): Promise<void> {
  'use server';
  revalidatePath('/dashboard/transactions');
}
