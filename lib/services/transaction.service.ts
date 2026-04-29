import { prisma } from '@/lib/db/prisma';
import type { TransactionType } from '@/prisma/generated';

export const PAGE_SIZE = 20;

export async function listTransactions(
  userId: string,
  page: number,
) {
  const skip = (page - 1) * PAGE_SIZE;

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        account:  { select: { id: true, name: true, currency: true } },
        category: { select: { id: true, name: true, icon: true, color: true } },
        payee:    { select: { id: true, name: true } },
      },
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  return { items, total, pageCount: Math.ceil(total / PAGE_SIZE) };
}

export function createTransaction(
  userId: string,
  data: {
    date: Date;
    amount: number;
    type: TransactionType;
    description: string;
    notes?: string;
    accountId: string;
    categoryId?: string;
    payeeId?: string;
  },
) {
  return prisma.transaction.create({ data: { ...data, userId } });
}

export function updateTransaction(
  id: string,
  userId: string,
  data: {
    date?: Date;
    amount?: number;
    type?: TransactionType;
    description?: string;
    notes?: string | null;
    accountId?: string;
    categoryId?: string | null;
    payeeId?: string | null;
  },
) {
  return prisma.transaction.update({ where: { id, userId }, data });
}

export function deleteTransaction(id: string, userId: string) {
  return prisma.transaction.delete({ where: { id, userId } });
}
