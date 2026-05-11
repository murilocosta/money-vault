import { Typography } from '@mui/material';
import { requireUserId } from '@/lib/dal';
import { listPayeesWithCounts } from '@/lib/services/payee.service';
import { SyncPayeesClient } from '@/components/sync-payees/sync-payees-client';

export default async function SyncPayeesPage() {
  const userId = await requireUserId();
  const payees = await listPayeesWithCounts(userId);

  const serialized = payees.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type as string,
    email: p.email,
    phone: p.phone,
    _count: { transactions: p._count.transactions },
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Sync Payees
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Select two or more payees to merge them into a single unified payee. All linked transactions will be reassigned automatically.
        </Typography>
      </div>

      <SyncPayeesClient payees={serialized} />
    </div>
  );
}
