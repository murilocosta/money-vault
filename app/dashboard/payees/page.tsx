import { listPayees } from '@/lib/services/payee.service';
import { PayeesTable } from '@/components/payees/payees-table';

export default async function PayeesPage() {
  const payees = await listPayees();
  return <PayeesTable payees={payees} />;
}
