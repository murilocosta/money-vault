import { prisma } from '@/lib/db/prisma';
import type { PayeeType } from '@/prisma/generated';

export function listPayees() {
  return prisma.payee.findMany({ orderBy: { name: 'asc' } });
}

export function createPayee(data: {
  name: string;
  type: PayeeType;
  email?: string;
  phone?: string;
  notes?: string;
}) {
  return prisma.payee.create({ data });
}

export function updatePayee(
  id: string,
  data: {
    name?: string;
    type?: PayeeType;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
  },
) {
  return prisma.payee.update({ where: { id }, data });
}

export function deletePayee(id: string) {
  return prisma.payee.delete({ where: { id } });
}
