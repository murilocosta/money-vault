'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import MergeIcon from '@mui/icons-material/MergeType';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { mergePayeesAction } from '@/app/actions/payees';

const PAYEE_TYPE_LABELS: Record<string, string> = {
  PERSON: 'Person',
  BUSINESS: 'Business',
  INSTITUTION: 'Institution',
  OTHER: 'Other',
};

const PAYEE_TYPE_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'default'> = {
  PERSON: 'primary',
  BUSINESS: 'success',
  INSTITUTION: 'secondary',
  OTHER: 'default',
};

const PAYEE_TYPE_OPTIONS = ['PERSON', 'BUSINESS', 'INSTITUTION', 'OTHER'] as const;

interface Payee {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  _count: { transactions: number };
}

interface Props {
  payees: Payee[];
}

export function SyncPayeesClient({ payees: initialPayees }: Props) {
  const [payees, setPayees] = useState(initialPayees);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nameFilter, setNameFilter] = useState('');
  const [unifiedName, setUnifiedName] = useState('');
  const [unifiedType, setUnifiedType] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [isMerging, startMerge] = useTransition();

  const visiblePayees = useMemo(() => {
    const q = nameFilter.trim().toLowerCase();
    if (!q) return payees;
    return payees.filter((p) => p.name.toLowerCase().includes(q));
  }, [payees, nameFilter]);

  const allVisible = visiblePayees.length > 0 && visiblePayees.every((p) => selected.has(p.id));
  const someVisible = !allVisible && visiblePayees.some((p) => selected.has(p.id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisible) {
        visiblePayees.forEach((p) => next.delete(p.id));
      } else {
        visiblePayees.forEach((p) => next.add(p.id));
      }
      return next;
    });
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function prefillFromSelection() {
    if (selected.size === 0) return;
    const first = payees.find((p) => selected.has(p.id));
    if (first) {
      if (!unifiedName) setUnifiedName(first.name);
      if (!unifiedType) setUnifiedType(first.type);
    }
  }

  function handleMerge() {
    if (selected.size < 2 || !unifiedName.trim() || !unifiedType) return;

    startMerge(async () => {
      const result = await mergePayeesAction({
        sourceIds: [...selected],
        name: unifiedName.trim(),
        type: unifiedType,
      });

      if (result.success) {
        const mergedCount = selected.size;
        setPayees((prev) => {
          const remaining = prev.filter((p) => !selected.has(p.id));
          const totalTx = prev
            .filter((p) => selected.has(p.id))
            .reduce((sum, p) => sum + p._count.transactions, 0);
          return [
            ...remaining,
            {
              id: result.data.mergedId,
              name: unifiedName.trim(),
              type: unifiedType,
              email: null,
              phone: null,
              _count: { transactions: totalTx },
            },
          ].sort((a, b) => a.name.localeCompare(b.name));
        });
        setSelected(new Set());
        setUnifiedName('');
        setUnifiedType('');
        setSnackbar({ msg: `${mergedCount} payees merged into "${unifiedName.trim()}".`, severity: 'success' });
      } else {
        setSnackbar({ msg: result.error, severity: 'error' });
      }
    });
  }

  const canMerge = selected.size >= 2 && unifiedName.trim().length > 0 && unifiedType.length > 0;

  return (
    <>
      {/* Merge panel */}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 3, mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Merge settings
        </Typography>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            size="small"
            label="Unified name"
            value={unifiedName}
            onChange={(e) => setUnifiedName(e.target.value)}
            placeholder="Enter new payee name…"
            fullWidth
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Unified type</InputLabel>
            <Select
              value={unifiedType}
              label="Unified type"
              onChange={(e) => setUnifiedType(e.target.value)}
              displayEmpty
            >
              {PAYEE_TYPE_OPTIONS.map((t) => (
                <MenuItem key={t} value={t}>{PAYEE_TYPE_LABELS[t]}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<MergeIcon />}
            onClick={handleMerge}
            disabled={!canMerge || isMerging}
            fullWidth
            sx={{ height: 40, alignSelf: 'center' }}
          >
            {isMerging ? 'Merging…' : `Merge ${selected.size > 0 ? `${selected.size} ` : ''}payees`}
          </Button>
        </div>

        {selected.size > 0 && selected.size < 2 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Select at least 2 payees to merge.
          </Alert>
        )}

        {selected.size >= 2 && (
          <Box className="flex items-center gap-2 mt-3 flex-wrap">
            <Typography variant="body2" color="text.secondary">
              Selected:
            </Typography>
            {[...selected].map((id) => {
              const p = payees.find((x) => x.id === id);
              return p ? (
                <Chip
                  key={id}
                  label={p.name}
                  size="small"
                  onDelete={() => toggleRow(id)}
                />
              ) : null;
            })}
            <Button
              size="small"
              variant="text"
              color="inherit"
              sx={{ ml: 'auto' }}
              onClick={() => { setSelected(new Set()); setUnifiedName(''); setUnifiedType(''); }}
            >
              Clear selection
            </Button>
          </Box>
        )}
      </Paper>

      {/* Filter bar */}
      <Box className="flex flex-wrap items-end gap-3 mb-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
        <TextField
          size="small"
          label="Search by name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          sx={{ minWidth: 240 }}
          placeholder="Type to filter…"
        />

        {nameFilter.trim() !== '' && (
          <>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<FilterListOffIcon />}
              onClick={() => setNameFilter('')}
            >
              Clear
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', alignSelf: 'center' }}>
              Showing {visiblePayees.length} of {payees.length}
            </Typography>
          </>
        )}
      </Box>

      {/* Payees table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.50' } }}>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={allVisible}
                  indeterminate={someVisible}
                  onChange={toggleAll}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Transactions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visiblePayees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                  No payees found
                </TableCell>
              </TableRow>
            ) : (
              visiblePayees.map((payee) => {
                const isSelected = selected.has(payee.id);
                return (
                  <TableRow
                    key={payee.id}
                    hover
                    selected={isSelected}
                    onClick={() => {
                      toggleRow(payee.id);
                      if (!isSelected) prefillFromSelection();
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox size="small" checked={isSelected} onChange={() => toggleRow(payee.id)} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {payee.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={PAYEE_TYPE_LABELS[payee.type] ?? payee.type}
                        color={PAYEE_TYPE_COLORS[payee.type] ?? 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {payee.email ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {payee.phone ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{payee._count.transactions}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={5000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar?.severity} onClose={() => setSnackbar(null)}>
          {snackbar?.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
