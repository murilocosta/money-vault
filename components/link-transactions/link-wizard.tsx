'use client';

import { useState, useTransition } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { linkTransactionsAction } from '@/app/actions/link-transactions';

const TYPE_CHIP: Record<string, { label: string; color: 'success' | 'error' | 'info' }> = {
  INCOME:   { label: 'Income',   color: 'success' },
  EXPENSE:  { label: 'Expense',  color: 'error'   },
  TRANSFER: { label: 'Transfer', color: 'info'    },
};

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
  // initial filter values passed from the server
  initAccountId: string;
  initDateFrom: string;
  initDateTo: string;
  initPayeeId: string;
  initStep2AccountId: string;
  initStep2DateFrom: string;
  initStep2DateTo: string;
  initStep2PayeeId: string;
  // callbacks to reload data
  onStep1Filter: (accountId: string, dateFrom: string, dateTo: string, payeeId: string) => void;
  onStep2Filter: (accountId: string, dateFrom: string, dateTo: string, payeeId: string) => void;
}

export function LinkWizard({
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
  onStep1Filter,
  onStep2Filter,
}: Props) {
  const [step, setStep] = useState(0);
  const [selectedCreditTx, setSelectedCreditTx] = useState<TxRow | null>(null);
  const [selectedSourceTx, setSelectedSourceTx] = useState<TxRow | null>(null);

  // Step 1 filter state
  const [s1Account, setS1Account] = useState(initAccountId);
  const [s1From,    setS1From]    = useState(initDateFrom);
  const [s1To,      setS1To]      = useState(initDateTo);
  const [s1Payee,   setS1Payee]   = useState(initPayeeId);

  // Step 2 filter state (dates inherit from step 1 but are editable)
  const [s2Account, setS2Account] = useState(initStep2AccountId);
  const [s2From,    setS2From]    = useState(initStep2DateFrom || initDateFrom);
  const [s2To,      setS2To]      = useState(initStep2DateTo   || initDateTo);
  const [s2Payee,   setS2Payee]   = useState(initStep2PayeeId);

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const [, startTransition] = useTransition();

  function applyStep1Filter() {
    onStep1Filter(s1Account, s1From, s1To, s1Payee);
  }

  function clearStep1Filter() {
    setS1Account(''); setS1From(''); setS1To(''); setS1Payee('');
    onStep1Filter('', '', '', '');
  }

  function applyStep2Filter() {
    onStep2Filter(s2Account, s2From, s2To, s2Payee);
  }

  function clearStep2Filter() {
    setS2Account(''); setS2From(''); setS2To(''); setS2Payee('');
    onStep2Filter('', '', '', '');
  }

  function goToStep2(tx: TxRow) {
    setSelectedCreditTx(tx);
    setSelectedSourceTx(null);
    // inherit step-1 dates into step-2 if not already set
    if (!s2From) setS2From(s1From);
    if (!s2To)   setS2To(s1To);
    setStep(1);
  }

  function goBack() {
    setSelectedSourceTx(null);
    setStep(0);
  }

  function handleLink() {
    if (!selectedCreditTx || !selectedSourceTx) return;
    startTransition(async () => {
      const result = await linkTransactionsAction(selectedCreditTx.id, selectedSourceTx.id);
      if (result.success) {
        setSnack({ open: true, message: 'Transactions linked successfully.', severity: 'success' });
        // reset to start
        setStep(0);
        setSelectedCreditTx(null);
        setSelectedSourceTx(null);
        setS1Account(''); setS1From(''); setS1To(''); setS1Payee('');
        setS2Account(''); setS2From(''); setS2To(''); setS2Payee('');
        onStep1Filter('', '', '', '');
      } else {
        setSnack({ open: true, message: result.error, severity: 'error' });
      }
    });
  }

  return (
    <Box>
      <Stepper activeStep={step} className="mb-8">
        <Step><StepLabel>Select credit card transaction</StepLabel></Step>
        <Step><StepLabel>Select source transaction</StepLabel></Step>
      </Stepper>

      {step === 0 && (
        <Step1
          accounts={creditCardAccounts}
          payees={payees}
          transactions={creditCardTxs}
          accountId={s1Account}
          dateFrom={s1From}
          dateTo={s1To}
          payeeId={s1Payee}
          onAccountChange={setS1Account}
          onDateFromChange={setS1From}
          onDateToChange={setS1To}
          onPayeeChange={setS1Payee}
          onApply={applyStep1Filter}
          onClear={clearStep1Filter}
          onSelect={goToStep2}
        />
      )}

      {step === 1 && selectedCreditTx && (
        <Step2
          creditTx={selectedCreditTx}
          accounts={otherAccounts}
          payees={payees}
          transactions={otherTxs}
          accountId={s2Account}
          dateFrom={s2From}
          dateTo={s2To}
          payeeId={s2Payee}
          selectedSourceTx={selectedSourceTx}
          onAccountChange={setS2Account}
          onDateFromChange={setS2From}
          onDateToChange={setS2To}
          onPayeeChange={setS2Payee}
          onApply={applyStep2Filter}
          onClear={clearStep2Filter}
          onSelectSource={setSelectedSourceTx}
          onBack={goBack}
          onLink={handleLink}
        />
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ─── Step 1 ──────────────────────────────────────────────────────────────────

interface Step1Props {
  accounts: SelectOption[];
  payees: SelectOption[];
  transactions: TxRow[];
  accountId: string;
  dateFrom: string;
  dateTo: string;
  payeeId: string;
  onAccountChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onPayeeChange: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
  onSelect: (tx: TxRow) => void;
}

function Step1({
  accounts, payees, transactions,
  accountId, dateFrom, dateTo, payeeId,
  onAccountChange, onDateFromChange, onDateToChange, onPayeeChange,
  onApply, onClear, onSelect,
}: Step1Props) {
  const hasFilters = accountId || dateFrom || dateTo || payeeId;

  return (
    <Box>
      <Typography variant="h6" className="mb-4">Credit card transactions</Typography>

      <FilterBar
        accounts={accounts}
        payees={payees}
        accountId={accountId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        payeeId={payeeId}
        accountLabel="Credit card account"
        onAccountChange={onAccountChange}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        onPayeeChange={onPayeeChange}
        onApply={onApply}
        onClear={onClear}
        hasFilters={!!hasFilters}
      />

      <TxTable
        transactions={transactions}
        actionLabel="Select"
        actionIcon={<ArrowForwardIcon fontSize="small" />}
        onAction={onSelect}
        emptyMessage="No credit card transactions match the filters."
      />
    </Box>
  );
}

// ─── Step 2 ──────────────────────────────────────────────────────────────────

interface Step2Props {
  creditTx: TxRow;
  accounts: SelectOption[];
  payees: SelectOption[];
  transactions: TxRow[];
  accountId: string;
  dateFrom: string;
  dateTo: string;
  payeeId: string;
  selectedSourceTx: TxRow | null;
  onAccountChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onPayeeChange: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
  onSelectSource: (tx: TxRow) => void;
  onBack: () => void;
  onLink: () => void;
}

function Step2({
  creditTx, accounts, payees, transactions,
  accountId, dateFrom, dateTo, payeeId,
  selectedSourceTx,
  onAccountChange, onDateFromChange, onDateToChange, onPayeeChange,
  onApply, onClear, onSelectSource, onBack, onLink,
}: Step2Props) {
  const hasFilters = accountId || dateFrom || dateTo || payeeId;

  return (
    <Box>
      {/* Reference card */}
      <Typography variant="subtitle2" className="mb-2" color="text.secondary">
        Linking credit card transaction
      </Typography>
      <Paper
        variant="outlined"
        className="mb-6 p-4 rounded-xl"
        sx={{ borderColor: 'primary.main', bgcolor: 'primary.50' }}
      >
        <Box className="flex flex-wrap items-center gap-4">
          <Box className="flex-1 min-w-0">
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
              {creditTx.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {creditTx.account.name} &middot; {new Date(creditTx.date).toLocaleDateString()}
              {creditTx.payee ? ` · ${creditTx.payee.name}` : ''}
            </Typography>
          </Box>
          <Box className="flex items-center gap-3">
            <Chip
              label={TYPE_CHIP[creditTx.type]?.label ?? creditTx.type}
              color={TYPE_CHIP[creditTx.type]?.color ?? 'default'}
              size="small"
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, minWidth: 90, textAlign: 'right' }}>
              {Number(creditTx.amount).toLocaleString(undefined, {
                style: 'currency',
                currency: creditTx.account.currency,
              })}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Typography variant="h6" className="mb-4">Select source transaction</Typography>

      <FilterBar
        accounts={accounts}
        payees={payees}
        accountId={accountId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        payeeId={payeeId}
        accountLabel="Account"
        onAccountChange={onAccountChange}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        onPayeeChange={onPayeeChange}
        onApply={onApply}
        onClear={onClear}
        hasFilters={!!hasFilters}
      />

      <TxTable
        transactions={transactions}
        actionLabel="Select"
        actionIcon={<ArrowForwardIcon fontSize="small" />}
        onAction={onSelectSource}
        selectedId={selectedSourceTx?.id}
        emptyMessage="No transactions match the filters."
      />

      <Box className="flex justify-between mt-6">
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} variant="outlined">
          Back
        </Button>
        <Tooltip title={!selectedSourceTx ? 'Select a source transaction first' : ''}>
          <span>
            <Button
              variant="contained"
              startIcon={<LinkIcon />}
              onClick={onLink}
              disabled={!selectedSourceTx}
            >
              Link transactions
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ─── Shared FilterBar ─────────────────────────────────────────────────────────

interface FilterBarProps {
  accounts: SelectOption[];
  payees: SelectOption[];
  accountId: string;
  dateFrom: string;
  dateTo: string;
  payeeId: string;
  accountLabel: string;
  hasFilters: boolean;
  onAccountChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onPayeeChange: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
}

function FilterBar({
  accounts, payees,
  accountId, dateFrom, dateTo, payeeId,
  accountLabel, hasFilters,
  onAccountChange, onDateFromChange, onDateToChange, onPayeeChange,
  onApply, onClear,
}: FilterBarProps) {
  return (
    <Box className="flex flex-wrap items-end gap-3 mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>{accountLabel}</InputLabel>
        <Select
          label={accountLabel}
          value={accountId}
          onChange={(e) => onAccountChange(e.target.value)}
        >
          <MenuItem value=""><em>All</em></MenuItem>
          {accounts.map((a) => (
            <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="From"
        type="date"
        size="small"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 150 }}
      />

      <TextField
        label="To"
        type="date"
        size="small"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 150 }}
      />

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Payee</InputLabel>
        <Select
          label="Payee"
          value={payeeId}
          onChange={(e) => onPayeeChange(e.target.value)}
        >
          <MenuItem value=""><em>All payees</em></MenuItem>
          {payees.map((p) => (
            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button variant="contained" size="small" onClick={onApply}>
        Apply
      </Button>

      {hasFilters && (
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<FilterListOffIcon />}
          onClick={onClear}
        >
          Clear
        </Button>
      )}
    </Box>
  );
}

// ─── Shared TxTable ───────────────────────────────────────────────────────────

interface TxTableProps {
  transactions: TxRow[];
  actionLabel: string;
  actionIcon: React.ReactNode;
  onAction: (tx: TxRow) => void;
  selectedId?: string;
  emptyMessage: string;
}

function TxTable({ transactions, actionLabel, actionIcon, onAction, selectedId, emptyMessage }: TxTableProps) {
  if (transactions.length === 0) {
    return (
      <Paper variant="outlined" className="p-8 rounded-xl text-center">
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Account</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Payee</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">Linked</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((tx) => {
            const isSelected = tx.id === selectedId;
            return (
              <TableRow
                key={tx.id}
                hover
                selected={isSelected}
                sx={isSelected ? { bgcolor: 'primary.50', '& td': { fontWeight: 600 } } : {}}
              >
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </TableCell>
                <TableCell>{tx.description}</TableCell>
                <TableCell>{tx.account.name}</TableCell>
                <TableCell>{tx.payee?.name ?? '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={TYPE_CHIP[tx.type]?.label ?? tx.type}
                    color={TYPE_CHIP[tx.type]?.color ?? 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  {Number(tx.amount).toLocaleString(undefined, {
                    style: 'currency',
                    currency: tx.account.currency,
                  })}
                </TableCell>
                <TableCell align="center">
                  {(tx.linkedFromId || tx.linkedToId) ? (
                    <Tooltip title="Already linked">
                      <LinkIcon fontSize="small" color="primary" />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Not linked">
                      <LinkOffIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant={isSelected ? 'contained' : 'outlined'}
                    endIcon={actionIcon}
                    onClick={() => onAction(tx)}
                  >
                    {isSelected ? 'Selected' : actionLabel}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
