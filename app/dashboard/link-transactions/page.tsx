import { Suspense } from 'react';
import { requireUserId } from '@/lib/dal';
import { listAccounts } from '@/lib/services/account.service';
import { listPayees } from '@/lib/services/payee.service';
import { listTransactionsForLinking } from '@/lib/services/transaction.service';
import { LinkWizardShell } from '@/components/link-transactions/link-wizard-shell';

interface Props {
  searchParams: Promise<{
    s1Account?: string;
    s1From?: string;
    s1To?: string;
    s1Payee?: string;
    s2Account?: string;
    s2From?: string;
    s2To?: string;
    s2Payee?: string;
  }>;
}

export default async function LinkTransactionsPage({ searchParams }: Props) {
  const {
    s1Account = '',
    s1From    = '',
    s1To      = '',
    s1Payee   = '',
    s2Account = '',
    s2From    = '',
    s2To      = '',
    s2Payee   = '',
  } = await searchParams;

  const userId = await requireUserId();

  const [accounts, payees, creditCardTxs, otherTxs] = await Promise.all([
    listAccounts(userId),
    listPayees(userId),
    listTransactionsForLinking(userId, 'CREDIT_CARD', false, {
      accountId: s1Account || undefined,
      dateFrom:  s1From    || undefined,
      dateTo:    s1To      || undefined,
      payeeId:   s1Payee   || undefined,
    }),
    listTransactionsForLinking(userId, 'CREDIT_CARD', true, {
      accountId: s2Account || undefined,
      dateFrom:  s2From    || undefined,
      dateTo:    s2To      || undefined,
      payeeId:   s2Payee   || undefined,
    }),
  ]);

  const creditCardAccounts = accounts
    .filter((a) => a.type === 'CREDIT_CARD')
    .map((a) => ({ id: a.id, name: a.name }));

  const otherAccounts = accounts
    .filter((a) => a.type !== 'CREDIT_CARD')
    .map((a) => ({ id: a.id, name: a.name }));

  const payeeOptions = payees.map((p) => ({ id: p.id, name: p.name }));

  const mapTx = (tx: typeof creditCardTxs[number]) => ({
    id:           tx.id,
    date:         tx.date.toISOString().slice(0, 10),
    amount:       tx.amount.toString(),
    type:         tx.type,
    description:  tx.description,
    account:      { id: tx.account.id, name: tx.account.name, currency: tx.account.currency },
    category:     tx.category ? { id: tx.category.id, name: tx.category.name, icon: tx.category.icon } : null,
    payee:        tx.payee    ? { id: tx.payee.id,    name: tx.payee.name }                             : null,
    linkedFromId: tx.linkedFromId,
    linkedToId:   tx.linkedTo?.id ?? null,
  });

  return (
    <Suspense>
      <LinkWizardShell
        creditCardAccounts={creditCardAccounts}
        otherAccounts={otherAccounts}
        payees={payeeOptions}
        creditCardTxs={creditCardTxs.map(mapTx)}
        otherTxs={otherTxs.map(mapTx)}
        initAccountId={s1Account}
        initDateFrom={s1From}
        initDateTo={s1To}
        initPayeeId={s1Payee}
        initStep2AccountId={s2Account}
        initStep2DateFrom={s2From}
        initStep2DateTo={s2To}
        initStep2PayeeId={s2Payee}
      />
    </Suspense>
  );
}
