'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import type { CategoryMonthlyExpense } from '@/lib/services/account.service';

interface AccountOption {
  id:       string;
  name:     string;
  currency: string;
}

interface Props {
  accounts:          AccountOption[];
  selectedAccountId: string;
  selectedYear:      number;
  data:              CategoryMonthlyExpense[];
  currency:          string;
}

const MONTHS     = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR - i);

// Palette used when category has no color
const FALLBACK_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899',
  '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

export function CategoryLineChart({ accounts, selectedAccountId, selectedYear, data, currency }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const chartRef     = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<import('c3').ChartAPI | null>(null);

  // default: all categories selected
  const [selectedCats, setSelectedCats] = useState<string[]>(() => data.map((d) => d.categoryId));

  function navigate(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  }

  useEffect(() => {
    if (!chartRef.current) return;

    const visible = data.filter((d) => selectedCats.includes(d.categoryId));

    const columns = visible.map((cat): [string, ...number[]] => {
      return [cat.categoryName, ...cat.months];
    });

    const colors: Record<string, string> = {};
    visible.forEach((cat, idx) => {
      colors[cat.categoryName] = cat.color ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
    });

    import('c3').then(({ default: c3 }) => {
      chartInstance.current?.destroy();

      if (columns.length === 0) {
        chartInstance.current = null;
        return;
      }

      chartInstance.current = c3.generate({
        bindto: chartRef.current!,
        data: {
          columns,
          type:   'line',
          colors,
        },
        axis: {
          x: {
            type:       'category',
            categories: MONTHS,
          },
          y: {
            label: { text: currency, position: 'outer-middle' },
            min:   0,
            padding: { bottom: 0 },
            tick: {
              format: (v: number) =>
                new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(v),
            },
          },
        },
        point: { r: 4 },
        grid:  { y: { show: true } },
        tooltip: {
          format: {
            value: (v: number) =>
              new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v),
          },
        },
        legend: { position: 'bottom' },
      });
    });

    return () => {
      chartInstance.current?.destroy();
      chartInstance.current = null;
    };
  }, [data, currency, selectedCats]);

  const noData = data.length === 0;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 3 }}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Expenses by Category
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monthly evolution for {selectedYear}
          </Typography>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          {/* Category multi-select */}
          {data.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 220, maxWidth: 340 }}>
              <InputLabel>Categories</InputLabel>
              <Select
                multiple
                label="Categories"
                value={selectedCats}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCats(typeof val === 'string' ? val.split(',') : val);
                }}
                input={<OutlinedInput label="Categories" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((id) => {
                      const cat = data.find((d) => d.categoryId === id);
                      return cat ? <Chip key={id} label={cat.categoryName} size="small" /> : null;
                    })}
                  </Box>
                )}
              >
                {data.map((cat) => (
                  <MenuItem key={cat.categoryId} value={cat.categoryId}>
                    {cat.categoryName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

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
      ) : noData ? (
        <Box className="flex items-center justify-center py-16">
          <Typography variant="body2" color="text.secondary">
            No expense data for this account in {selectedYear}.
          </Typography>
        </Box>
      ) : selectedCats.length === 0 ? (
        <Box className="flex items-center justify-center py-16">
          <Typography variant="body2" color="text.secondary">
            Select at least one category to display the chart.
          </Typography>
        </Box>
      ) : (
        <div ref={chartRef} />
      )}
    </Paper>
  );
}
