'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Paper,
  Radio,
  Snackbar,
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
import MergeIcon from '@mui/icons-material/MergeType';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { absorbPayeesAction } from '@/app/actions/payees';

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
  const [targetId, setTargetId] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState('');
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
        // Clear target if it was among the deselected
        if (targetId && visiblePayees.some((p) => p.id === targetId)) {
          setTargetId(null);
        }
      } else {
        visiblePayees.forEach((p) => next.add(p.id));
        // Auto-assign target to the first visible if none set yet
        if (!targetId && visiblePayees.length > 0) {
          setTargetId(visiblePayees[0].id);
        }
      }
      return next;
    });
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // If deselecting the current target, promote the next selected payee
        if (targetId === id) {
          const remaining = [...next];
          setTargetId(remaining[0] ?? null);
        }
      } else {
        next.add(id);
        // First selection becomes the target automatically
        if (!targetId) setTargetId(id);
      }
      return next;
    });
  }

  function handleSetTarget(id: string) {
    if (!selected.has(id)) return;
    setTargetId(id);
  }

  function clearSelection() {
    setSelected(new Set());
    setTargetId(null);
  }

  const sourceIds = useMemo(
    () => [...selected].filter((id) => id !== targetId),
    [selected, targetId],
  );

  const target = targetId ? payees.find((p) => p.id === targetId) : null;
  const canMerge = !!targetId && sourceIds.length >= 1 && !isMerging;

  function handleMerge() {
    if (!canMerge || !targetId) return;

    startMerge(async () => {
      const result = await absorbPayeesAction({ targetId, sourceIds });

      if (result.success) {
        const absorbedCount = sourceIds.length;
        const absorbedTx = payees
          .filter((p) => sourceIds.includes(p.id))
          .reduce((sum, p) => sum + p._count.transactions, 0);

        setPayees((prev) =>
          prev
            .filter((p) => !sourceIds.includes(p.id))
            .map((p) =>
              p.id === targetId
                ? { ...p, _count: { transactions: p._count.transactions + absorbedTx } }
                : p,
            ),
        );
        setSelected(new Set());
        setTargetId(null);
        setSnackbar({
          msg: `${absorbedCount} payee${absorbedCount !== 1 ? 's' : ''} absorbed into "${target?.name}".`,
          severity: 'success',
        });
      } else {
        setSnackbar({ msg: result.error, severity: 'error' });
      }
    });
  }

  return (
    <>
      {/* Action panel */}
      {selected.size > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 2, p: 3, mb: 4 }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {selected.size} payee{selected.size !== 1 ? 's' : ''} selected
              </Typography>
              {target ? (
                <Typography variant="body2" color="text.secondary">
                  Keep <strong>{target.name}</strong> — absorb {sourceIds.length} duplicate{sourceIds.length !== 1 ? 's' : ''} into it.
                </Typography>
              ) : (
                <Typography variant="body2" color="warning.main">
                  Click the radio button on a row to mark it as the payee to keep.
                </Typography>
              )}
            </div>

            <div className="flex gap-2 items-center">
              <Button
                size="small"
                variant="text"
                color="inherit"
                onClick={clearSelection}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                startIcon={<MergeIcon />}
                onClick={handleMerge}
                disabled={!canMerge}
                size="small"
              >
                {isMerging ? 'Merging…' : 'Merge'}
              </Button>
            </div>
          </div>

          {selected.size >= 2 && (
            <Box className="flex items-center gap-2 mt-3 flex-wrap">
              {[...selected].map((id) => {
                const p = payees.find((x) => x.id === id);
                if (!p) return null;
                const isTarget = id === targetId;
                return (
                  <Chip
                    key={id}
                    label={p.name}
                    size="small"
                    color={isTarget ? 'primary' : 'default'}
                    variant={isTarget ? 'filled' : 'outlined'}
                    onDelete={() => toggleRow(id)}
                  />
                );
              })}
            </Box>
          )}
        </Paper>
      )}

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
              <Tooltip title="Mark as the payee to keep" placement="top" arrow>
                <TableCell sx={{ width: 48 }}>Keep</TableCell>
              </Tooltip>
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
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                  No payees found
                </TableCell>
              </TableRow>
            ) : (
              visiblePayees.map((payee) => {
                const isSelected = selected.has(payee.id);
                const isTarget = payee.id === targetId;
                return (
                  <TableRow
                    key={payee.id}
                    hover
                    selected={isSelected}
                    onClick={() => toggleRow(payee.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox size="small" checked={isSelected} onChange={() => toggleRow(payee.id)} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Tooltip
                        title={isSelected ? (isTarget ? 'This payee will be kept' : 'Click to keep this payee') : 'Select the row first'}
                        placement="right"
                      >
                        <span>
                          <Radio
                            size="small"
                            checked={isTarget}
                            disabled={!isSelected}
                            onChange={() => handleSetTarget(payee.id)}
                            sx={{ p: 0.5 }}
                          />
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: isTarget ? 700 : 500 }}>
                        {payee.name}
                        {isTarget && (
                          <Chip label="keep" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: 10 }} />
                        )}
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
