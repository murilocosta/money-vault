import { prisma } from '@/lib/db/prisma';
import type { TransactionType } from '@/prisma/generated';

export const PAGE_SIZE = 20;

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  categoryId?: string;
  payeeId?: string;
}

export async function listTransactions(
  userId: string,
  page: number,
  filters: TransactionFilters = {},
) {
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    userId,
    ...(filters.dateFrom || filters.dateTo
      ? {
          date: {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo   ? { lte: new Date(`${filters.dateTo}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
    ...(filters.accountId  ? { accountId:  filters.accountId  } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.payeeId    ? { payeeId:    filters.payeeId    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        account:  { select: { id: true, name: true, currency: true } },
        category: { select: { id: true, name: true, icon: true, color: true } },
        payee:    { select: { id: true, name: true } },
      },
    }),
    prisma.transaction.count({ where }),
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
