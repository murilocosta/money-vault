import { prisma } from '@/lib/db/prisma';
import type { AccountType } from '@/prisma/generated';

export function listAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export function getAccountById(id: string, userId: string) {
  return prisma.account.findUnique({ where: { id, userId } });
}

export function getPrincipalAccount(userId: string) {
  return prisma.account.findFirst({ where: { userId, isPrincipal: true } });
}

export function createAccount(
  userId: string,
  data: {
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
    description?: string;
  },
) {
  return prisma.account.create({ data: { ...data, userId } });
}

export function updateAccount(
  id: string,
  userId: string,
  data: {
    name?: string;
    type?: AccountType;
    balance?: number;
    currency?: string;
    description?: string;
    isActive?: boolean;
  },
) {
  return prisma.account.update({ where: { id, userId }, data });
}

export async function setPrincipalAccount(id: string, userId: string) {
  await prisma.$transaction([
    prisma.account.updateMany({ where: { userId }, data: { isPrincipal: false } }),
    prisma.account.update({ where: { id, userId }, data: { isPrincipal: true } }),
  ]);
}

export function deleteAccount(id: string, userId: string) {
  return prisma.account.delete({ where: { id, userId } });
}

export interface MonthlyTotal {
  month: number; // 1–12
  income: number;
  expense: number;
}

export async function getMonthlyTotals(
  userId: string,
  accountId: string,
  year: number,
): Promise<MonthlyTotal[]> {
  const start = new Date(year, 0, 1);
  const end   = new Date(year + 1, 0, 1);

  const txs = await prisma.transaction.findMany({
    where: { userId, accountId, date: { gte: start, lt: end } },
    select: { date: true, type: true, amount: true },
  });

  const map = new Map<number, MonthlyTotal>();
  for (let m = 1; m <= 12; m++) map.set(m, { month: m, income: 0, expense: 0 });

  for (const tx of txs) {
    const m     = tx.date.getMonth() + 1;
    const entry = map.get(m)!;
    const val   = Number(tx.amount);
    if (tx.type === 'INCOME') {
      entry.income += val;
    } else {
      // EXPENSE + TRANSFER both count as outflow
      entry.expense += val;
    }
  }

  return [...map.values()];
}

export interface CategoryMonthlyExpense {
  categoryId:   string;
  categoryName: string;
  color:        string | null;
  months:       number[];
}

export async function getCategoryMonthlyExpenses(
  userId:    string,
  accountId: string,
  year:      number,
): Promise<CategoryMonthlyExpense[]> {
  const start = new Date(year, 0, 1);
  const end   = new Date(year + 1, 0, 1);

  const txs = await prisma.transaction.findMany({
    where: {
      userId,
      accountId,
      date: { gte: start, lt: end },
      type: { in: ['EXPENSE', 'TRANSFER'] },
    },
    select: {
      date:     true,
      amount:   true,
      category: { select: { id: true, name: true, color: true } },
    },
  });

  // accumulate per category
  const map = new Map<string, CategoryMonthlyExpense>();

  for (const tx of txs) {
    const catId   = tx.category?.id   ?? '__uncategorized__';
    const catName = tx.category?.name ?? 'Uncategorized';
    const catColor= tx.category?.color ?? null;

    if (!map.has(catId)) {
      map.set(catId, { categoryId: catId, categoryName: catName, color: catColor, months: Array(12).fill(0) });
    }

    const monthIdx = tx.date.getMonth(); // 0-based
    map.get(catId)!.months[monthIdx] += Number(tx.amount);
  }

  // only return categories that have at least one non-zero month
  return [...map.values()].filter((c) => c.months.some((v) => v > 0));
}
