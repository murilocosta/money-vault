'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';

interface SelectOption { id: string; name: string }
interface CategoryOption extends SelectOption { icon: string | null; color: string | null }

interface ActiveFilters {
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  categoryId?: string;
  payeeId?: string;
}

interface Props {
  accounts: SelectOption[];
  categories: CategoryOption[];
  payees: SelectOption[];
  filters: ActiveFilters;
}

export function TransactionFilters({ accounts, categories, payees, filters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    startTransition(() => router.push(`?${params.toString()}`));
  }

  function clearFilters() {
    const params = new URLSearchParams();
    startTransition(() => router.push(`?${params.toString()}`));
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <Box className="flex flex-wrap items-end gap-3 mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
      <TextField
        label="From"
        type="date"
        size="small"
        value={filters.dateFrom ?? ''}
        onChange={(e) => applyFilter('dateFrom', e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 150 }}
      />

      <TextField
        label="To"
        type="date"
        size="small"
        value={filters.dateTo ?? ''}
        onChange={(e) => applyFilter('dateTo', e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 150 }}
      />

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Account</InputLabel>
        <Select
          label="Account"
          value={filters.accountId ?? ''}
          onChange={(e) => applyFilter('accountId', e.target.value)}
        >
          <MenuItem value=""><em>All accounts</em></MenuItem>
          {accounts.map((a) => (
            <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Category</InputLabel>
        <Select
          label="Category"
          value={filters.categoryId ?? ''}
          onChange={(e) => applyFilter('categoryId', e.target.value)}
        >
          <MenuItem value=""><em>All categories</em></MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ''}{c.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Payee</InputLabel>
        <Select
          label="Payee"
          value={filters.payeeId ?? ''}
          onChange={(e) => applyFilter('payeeId', e.target.value)}
        >
          <MenuItem value=""><em>All payees</em></MenuItem>
          {payees.map((p) => (
            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {hasFilters && (
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<FilterListOffIcon />}
          onClick={clearFilters}
        >
          Clear
        </Button>
      )}
    </Box>
  );
}
