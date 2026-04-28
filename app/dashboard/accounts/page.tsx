import { listAccounts } from '@/lib/services/account.service';
import { AccountsTable } from '@/components/accounts/accounts-table';

export default async function AccountsPage() {
  const accounts = await listAccounts();

  const serialized = accounts.map((a) => ({
    ...a,
    balance: a.balance.toString(),
  }));

  return <AccountsTable accounts={serialized} />;
}
