import { prisma } from '@/lib/db/prisma';

export function listCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export function createCategory(data: { name: string; color?: string; icon?: string }) {
  return prisma.category.create({ data });
}

export function updateCategory(
  id: string,
  data: { name?: string; color?: string | null; icon?: string | null },
) {
  return prisma.category.update({ where: { id }, data });
}

export function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}
