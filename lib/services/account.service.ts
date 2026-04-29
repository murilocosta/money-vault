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

export function deleteAccount(id: string, userId: string) {
  return prisma.account.delete({ where: { id, userId } });
}
