import { Suspense } from 'react';
import { Typography } from '@mui/material';
import { requireUserId } from '@/lib/dal';
import { listAccounts, getPrincipalAccount, getMonthlyTotals, getCategoryMonthlyExpenses } from '@/lib/services/account.service';
import { MonthlyBarChart } from '@/components/dashboard/monthly-bar-chart';
import { CategoryLineChart } from '@/components/dashboard/category-line-chart';

interface Props {
  searchParams: Promise<{ accountId?: string; year?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { accountId: accountIdParam, year: yearParam } = await searchParams;

  const userId   = await requireUserId();
  const accounts = await listAccounts(userId);

  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name, currency: a.currency }));

  const principal = accounts.find((a) => a.isPrincipal) ?? await getPrincipalAccount(userId);
  const fallback  = accounts[0];

  const resolvedAccountId = accountIdParam ?? principal?.id ?? fallback?.id ?? '';
  const resolvedYear      = Math.max(2000, parseInt(yearParam ?? String(new Date().getFullYear()), 10) || new Date().getFullYear());

  const selectedAccount = accounts.find((a) => a.id === resolvedAccountId);

  const currency = selectedAccount?.currency ?? 'EUR';

  const [monthlyData, categoryData] = await Promise.all([
    resolvedAccountId ? getMonthlyTotals(userId, resolvedAccountId, resolvedYear)            : Promise.resolve([]),
    resolvedAccountId ? getCategoryMonthlyExpenses(userId, resolvedAccountId, resolvedYear)  : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" className="mt-0.5">
          Your financial overview.
        </Typography>
      </div>

      <Suspense>
        <MonthlyBarChart
          accounts={accountOptions}
          selectedAccountId={resolvedAccountId}
          selectedYear={resolvedYear}
          data={monthlyData}
          currency={currency}
        />
      </Suspense>

      <Suspense>
        <CategoryLineChart
          accounts={accountOptions}
          selectedAccountId={resolvedAccountId}
          selectedYear={resolvedYear}
          data={categoryData}
          currency={currency}
        />
      </Suspense>
    </div>
  );
}
