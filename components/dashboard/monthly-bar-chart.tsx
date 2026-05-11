'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import type { MonthlyTotal } from '@/lib/services/account.service';

interface AccountOption {
  id: string;
  name: string;
}

interface Props {
  accounts: AccountOption[];
  selectedAccountId: string;
  selectedYear: number;
  data: MonthlyTotal[];
  currency: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR - i);

export function MonthlyBarChart({ accounts, selectedAccountId, selectedYear, data, currency }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<import('c3').ChartAPI | null>(null);

  function navigate(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  }

  useEffect(() => {
    if (!chartRef.current) return;

    const income  = data.map((d) => d.income);
    const expense = data.map((d) => d.expense);

    import('c3').then(({ default: c3 }) => {
      chartInstance.current?.destroy();
      chartInstance.current = c3.generate({
        bindto: chartRef.current!,
        data: {
          columns: [
            ['Income',  ...income],
            ['Expense', ...expense],
          ],
          type: 'bar',
          colors: {
            Income:  '#22c55e',
            Expense: '#ef4444',
          },
        },
        bar: { width: { ratio: 0.6 } },
        axis: {
          x: {
            type: 'category',
            categories: MONTHS,
          },
          y: {
            label: { text: currency, position: 'outer-middle' },
            tick: {
              format: (v: number) =>
                new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 2 }).format(v),
            },
          },
        },
        grid: { y: { show: true } },
        tooltip: {
          format: {
            value: (v: number) =>
              new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(v),
          },
        },
        legend: { position: 'bottom' },
      });
    });

    return () => {
      chartInstance.current?.destroy();
      chartInstance.current = null;
    };
  }, [data, currency]);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 3 }}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Income vs Expenses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monthly totals for {selectedYear}
          </Typography>
        </div>

        <div className="flex gap-3 flex-wrap">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Account</InputLabel>
            <Select
              label="Account"
              value={selectedAccountId}
              onChange={(e) => navigate('accountId', e.target.value)}
            >
              {accounts.map((a) => (
                <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Year</InputLabel>
            <Select
              label="Year"
              value={selectedYear}
              onChange={(e) => navigate('year', String(e.target.value))}
            >
              {YEAR_OPTIONS.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      {accounts.length === 0 ? (
        <Box className="flex items-center justify-center py-16">
          <Typography variant="body2" color="text.secondary">
            No accounts found. Create an account to see your chart.
          </Typography>
        </Box>
      ) : (
        <div ref={chartRef} />
      )}
    </Paper>
  );
}
