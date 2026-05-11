'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Box, Typography } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { LinkWizard } from './link-wizard';

interface SelectOption { id: string; name: string }

interface TxRow {
  id: string;
  date: string;
  amount: string;
  type: string;
  description: string;
  account:  { id: string; name: string; currency: string };
  category: { id: string; name: string; icon: string | null } | null;
  payee:    { id: string; name: string } | null;
  linkedFromId: string | null;
  linkedToId:   string | null;
}

interface Props {
  creditCardAccounts: SelectOption[];
  otherAccounts: SelectOption[];
  payees: SelectOption[];
  creditCardTxs: TxRow[];
  otherTxs: TxRow[];
  initAccountId: string;
  initDateFrom: string;
  initDateTo: string;
  initPayeeId: string;
  initStep2AccountId: string;
  initStep2DateFrom: string;
  initStep2DateTo: string;
  initStep2PayeeId: string;
}

export function LinkWizardShell({
  creditCardAccounts,
  otherAccounts,
  payees,
  creditCardTxs,
  otherTxs,
  initAccountId,
  initDateFrom,
  initDateTo,
  initPayeeId,
  initStep2AccountId,
  initStep2DateFrom,
  initStep2DateTo,
  initStep2PayeeId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function buildParams(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    return params.toString();
  }

  function onStep1Filter(accountId: string, dateFrom: string, dateTo: string, payeeId: string) {
    const qs = buildParams({ s1Account: accountId, s1From: dateFrom, s1To: dateTo, s1Payee: payeeId });
    startTransition(() => router.push(`?${qs}`));
  }

  function onStep2Filter(accountId: string, dateFrom: string, dateTo: string, payeeId: string) {
    const qs = buildParams({ s2Account: accountId, s2From: dateFrom, s2To: dateTo, s2Payee: payeeId });
    startTransition(() => router.push(`?${qs}`));
  }

  return (
    <Box>
      <Box className="flex items-center gap-2 mb-6">
        <LinkIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Link Transactions
        </Typography>
      </Box>

      <LinkWizard
        creditCardAccounts={creditCardAccounts}
        otherAccounts={otherAccounts}
        payees={payees}
        creditCardTxs={creditCardTxs}
        otherTxs={otherTxs}
        initAccountId={initAccountId}
        initDateFrom={initDateFrom}
        initDateTo={initDateTo}
        initPayeeId={initPayeeId}
        initStep2AccountId={initStep2AccountId}
        initStep2DateFrom={initStep2DateFrom}
        initStep2DateTo={initStep2DateTo}
        initStep2PayeeId={initStep2PayeeId}
        onStep1Filter={onStep1Filter}
        onStep2Filter={onStep2Filter}
      />
    </Box>
  );
}
