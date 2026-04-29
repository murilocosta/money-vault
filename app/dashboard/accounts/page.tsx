import { listAccounts } from '@/lib/services/account.service';
import { requireUserId } from '@/lib/dal';
import { AccountsTable } from '@/components/accounts/accounts-table';

export default async function AccountsPage() {
  const userId = await requireUserId();
  const accounts = await listAccounts(userId);

  const serialized = accounts.map((a) => ({
    ...a,
    balance: a.balance.toString(),
  }));

  return <AccountsTable accounts={serialized} />;
}
