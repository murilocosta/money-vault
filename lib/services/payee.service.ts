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

export async function absorbPayees(userId: string, targetId: string, sourceIds: string[]) {
  return prisma.$transaction(async (tx) => {
    const target = await tx.payee.findUnique({ where: { id: targetId, userId } });
    if (!target) throw new Error('Target payee not found');

    await tx.transaction.updateMany({
      where: { payeeId: { in: sourceIds }, userId },
      data: { payeeId: targetId },
    });

    await tx.payee.deleteMany({
      where: { id: { in: sourceIds }, userId },
    });

    return target;
  });
}
