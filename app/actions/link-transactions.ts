'use server';

import { revalidatePath } from 'next/cache';
import { requireUserId } from '@/lib/dal';
import { linkTransactions } from '@/lib/services/transaction.service';
import type { ActionResult } from '@/types';

export async function linkTransactionsAction(
  creditCardTxId: string,
  sourceTxId: string,
): Promise<ActionResult> {
  const userId = await requireUserId();
  await linkTransactions(userId, creditCardTxId, sourceTxId);
  revalidatePath('/dashboard/transactions');
  return { success: true, data: undefined };
}
