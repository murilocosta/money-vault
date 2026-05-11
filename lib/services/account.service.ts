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
