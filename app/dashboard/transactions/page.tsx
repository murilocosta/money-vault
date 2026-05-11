import { Suspense } from 'react';
import { requireUserId } from '@/lib/dal';
import { listTransactions } from '@/lib/services/transaction.service';
import { listAccounts } from '@/lib/services/account.service';
import { listCategories } from '@/lib/services/category.service';
import { listPayees } from '@/lib/services/payee.service';
import { TransactionsTable } from '@/components/transactions/transactions-table';

interface Props {
  searchParams: Promise<{
    page?: string;
    dateFrom?: string;
    dateTo?: string;
    accountId?: string;
    categoryId?: string;
    payeeId?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const { page: pageParam, dateFrom, dateTo, accountId, categoryId, payeeId } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const userId = await requireUserId();

  const filters = {
    ...(dateFrom   ? { dateFrom }   : {}),
    ...(dateTo     ? { dateTo }     : {}),
    ...(accountId  ? { accountId }  : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(payeeId    ? { payeeId }    : {}),
  };

  const [{ items, total, pageCount }, accounts, categories, payees] = await Promise.all([
    listTransactions(userId, page, filters),
    listAccounts(userId),
    listCategories(userId),
    listPayees(userId),
  ]);

  const transactions = items.map((tx) => ({
    ...tx,
    date:   tx.date.toISOString().slice(0, 10),
    amount: tx.amount.toString(),
  }));

  const accountOptions  = accounts.map((a) => ({ id: a.id, name: a.name }));
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon, color: c.color }));
  const payeeOptions    = payees.map((p) => ({ id: p.id, name: p.name }));

  return (
    <Suspense>
      <TransactionsTable
        transactions={transactions}
        pageCount={pageCount}
        currentPage={page}
        total={total}
        accounts={accountOptions}
        categories={categoryOptions}
        payees={payeeOptions}
        filters={filters}
      />
    </Suspense>
  );
}
