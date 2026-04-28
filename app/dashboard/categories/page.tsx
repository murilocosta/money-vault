import { listCategories } from '@/lib/services/category.service';
import { CategoriesTable } from '@/components/categories/categories-table';

export default async function CategoriesPage() {
  const categories = await listCategories();
  return <CategoriesTable categories={categories} />;
}
