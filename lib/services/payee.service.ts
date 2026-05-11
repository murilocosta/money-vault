import { prisma } from '@/lib/db/prisma';
import type { PayeeType } from '@/prisma/generated';

export function listPayees(userId: string) {
  return prisma.payee.findMany({ where: { userId }, orderBy: { name: 'asc' } });
}

export function listPayeesWithCounts(userId: string) {
  return prisma.payee.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { transactions: true } } },
  });
}

export function createPayee(
  userId: string,
  data: {
    name: string;
    type: PayeeType;
    email?: string;
    phone?: string;
    notes?: string;
  },
) {
  return prisma.payee.create({ data: { ...data, userId } });
}

export function updatePayee(
  id: string,
  userId: string,
  data: {
    name?: string;
    type?: PayeeType;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
  },
) {
  return prisma.payee.update({ where: { id, userId }, data });
}

export function deletePayee(id: string, userId: string) {
  return prisma.payee.delete({ where: { id, userId } });
}

export async function mergePayees(
  userId: string,
  sourceIds: string[],
  unified: { name: string; type: PayeeType },
) {
  return prisma.$transaction(async (tx) => {
    const merged = await tx.payee.create({
      data: { name: unified.name, type: unified.type, userId },
    });

    await tx.transaction.updateMany({
      where: { payeeId: { in: sourceIds }, userId },
      data: { payeeId: merged.id },
    });

    await tx.payee.deleteMany({
      where: { id: { in: sourceIds }, userId },
    });

    return merged;
  });
}
