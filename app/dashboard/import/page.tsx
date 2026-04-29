import { Suspense } from 'react';
import { Typography } from '@mui/material';
import { requireUserId } from '@/lib/dal';
import { listAccounts } from '@/lib/services/account.service';
import { listCategories } from '@/lib/services/category.service';
import { ImportCsvClient } from '@/components/import/import-csv-client';

export default async function ImportCsvPage() {
  const userId = await requireUserId();

  const [accounts, categories] = await Promise.all([
    listAccounts(userId),
    listCategories(userId),
  ]);

  const accountOptions  = accounts.map((a) => ({ id: a.id, name: a.name }));
  const categoryOptions = categories.map((c) => ({
    id:    c.id,
    name:  c.name,
    icon:  c.icon,
    color: c.color,
  }));

  return (
    <Suspense>
      <div className="mb-6">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Import CSV</Typography>
        <Typography variant="body2" color="text.secondary" className="mt-0.5">
          Parse a bank export and review transactions before saving.
        </Typography>
      </div>

      <ImportCsvClient accounts={accountOptions} categories={categoryOptions} />
    </Suspense>
  );
}
