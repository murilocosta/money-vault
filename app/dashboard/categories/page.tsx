import { listCategories } from '@/lib/services/category.service';
import { requireUserId } from '@/lib/dal';
import { CategoriesTable } from '@/components/categories/categories-table';

export default async function CategoriesPage() {
  const userId = await requireUserId();
  const categories = await listCategories(userId);
  return <CategoriesTable categories={categories} />;
}
