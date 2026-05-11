import { prisma } from '@/lib/db/prisma';
import type { AccountType, TransactionType } from '@/prisma/generated';

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

export interface LinkingFilters {
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  payeeId?: string;
}

export function listTransactionsForLinking(
  userId: string,
  accountType: AccountType,
  exclude: boolean, // true = exclude that type, false = only that type
  filters: LinkingFilters = {},
) {
  const where = {
    userId,
    account: exclude
      ? { type: { not: accountType } }
      : { type: accountType },
    ...(filters.accountId ? { accountId: filters.accountId } : {}),
    ...(filters.payeeId   ? { payeeId:   filters.payeeId }   : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          date: {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo   ? { lte: new Date(`${filters.dateTo}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
  };

  return prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 100,
    include: {
      account:  { select: { id: true, name: true, currency: true, type: true } },
      category: { select: { id: true, name: true, icon: true, color: true } },
      payee:    { select: { id: true, name: true } },
      linkedTo: { select: { id: true } },
    },
  });
}

export async function linkTransactions(
  userId: string,
  creditCardTxId: string,
  sourceTxId: string,
) {
  // The credit card tx stores linkedFromId pointing to the source tx
  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: creditCardTxId, userId },
      data:  { linkedFromId: sourceTxId },
    }),
  ]);
}
