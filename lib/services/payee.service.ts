import { prisma } from '@/lib/db/prisma';
import type { PayeeType } from '@/prisma/generated';

export function listPayees(userId: string) {
  return prisma.payee.findMany({ where: { userId }, orderBy: { name: 'asc' } });
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
