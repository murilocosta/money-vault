import { listPayees } from '@/lib/services/payee.service';
import { requireUserId } from '@/lib/dal';
import { PayeesTable } from '@/components/payees/payees-table';

export default async function PayeesPage() {
  const userId = await requireUserId();
  const payees = await listPayees(userId);
  return <PayeesTable payees={payees} />;
}
