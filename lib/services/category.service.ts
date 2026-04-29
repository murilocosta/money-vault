import { prisma } from '@/lib/db/prisma';

export function listCategories(userId: string) {
  return prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } });
}

export function createCategory(
  userId: string,
  data: { name: string; color?: string; icon?: string },
) {
  return prisma.category.create({ data: { ...data, userId } });
}

export function updateCategory(
  id: string,
  userId: string,
  data: { name?: string; color?: string | null; icon?: string | null },
) {
  return prisma.category.update({ where: { id, userId }, data });
}

export function deleteCategory(id: string, userId: string) {
  return prisma.category.delete({ where: { id, userId } });
}
