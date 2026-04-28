import { prisma } from '@/lib/db/prisma';
import type { AccountType } from '@/prisma/generated';

export function listAccounts() {
  return prisma.account.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export function getAccountById(id: string) {
  return prisma.account.findUnique({ where: { id } });
}

export function createAccount(data: {
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  description?: string;
}) {
  return prisma.account.create({ data });
}

export function updateAccount(
  id: string,
  data: {
    name?: string;
    type?: AccountType;
    balance?: number;
    currency?: string;
    description?: string;
    isActive?: boolean;
  },
) {
  return prisma.account.update({ where: { id }, data });
}

export function deleteAccount(id: string) {
  return prisma.account.delete({ where: { id } });
}
