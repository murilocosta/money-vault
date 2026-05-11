'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
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
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LabelIcon from '@mui/icons-material/Label';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { readCSV } from 'danfojs';
import type { CsvFormat, ParsedRow } from '@/lib/csv-parser';
import { parseCsvDataFrame } from '@/lib/csv-parser';
import { importCsvAction, type ImportRow } from '@/app/actions/import-csv';

interface SelectOption { id: string; name: string }
interface CategoryOption extends SelectOption { icon: string | null; color: string | null }

interface Props {
  accounts: SelectOption[];
  categories: CategoryOption[];
}

interface PreviewRow extends ParsedRow {
  categoryId?: string;
}

const FORMAT_LABELS: Record<CsvFormat, string> = {
  'bank-austria': 'Bank Austria',
  paypal: 'PayPal',
};

const TYPE_CHIP: Record<string, { label: string; color: 'success' | 'error' | 'info' }> = {
  INCOME: { label: 'Income', color: 'success' },
  EXPENSE: { label: 'Expense', color: 'error' },
  TRANSFER: { label: 'Transfer', color: 'info' },
};

function fmtDate(iso: Date) {
  return iso.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CategoryChip({ cat }: { cat: CategoryOption }) {
  return (
    <div className="flex items-center gap-1">
      {cat.color && (
        <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
      )}
      <span>{cat.icon ? `${cat.icon} ` : ''}{cat.name}</span>
    </div>
  );
}

export function ImportCsvClient({ accounts, categories }: Props) {
  const [format, setFormat] = useState<CsvFormat>('bank-austria');
  const [delimiter, setDelimiter] = useState(';');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkCatId, setBulkCatId] = useState('');
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [isParsing, startParse] = useTransition();
  const [isSaving, startSave] = useTransition();

  const [descFilter, setDescFilter] = useState('');
  const [payeeFilter, setPayeeFilter] = useState('');

  const uniquePayees = useMemo(
    () => [...new Set(rows.map((r) => r.payeeName).filter(Boolean))].sort(),
    [rows],
  );

  // visibleRows maps filtered rows back to their original index so selection and edits stay in sync
  const visibleRows = useMemo(() => {
    const desc = descFilter.trim().toLowerCase();
    return rows
      .map((r, i) => ({ row: r, idx: i }))
      .filter(({ row }) => {
        if (desc && !row.description.toLowerCase().includes(desc)) return false;
        if (payeeFilter && row.payeeName !== payeeFilter) return false;
        return true;
      });
  }, [rows, descFilter, payeeFilter]);

  const hasFilter = descFilter.trim() !== '' || payeeFilter !== '';

  // ── Selection helpers ──────────────────────────────────────────────────────

  const visibleIndices = useMemo(() => visibleRows.map(({ idx }) => idx), [visibleRows]);
  const allVisibleSelected = visibleIndices.length > 0 && visibleIndices.every((i) => selected.has(i));
  const someVisibleSelected = !allVisibleSelected && visibleIndices.some((i) => selected.has(i));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIndices.forEach((i) => next.delete(i));
      } else {
        visibleIndices.forEach((i) => next.add(i));
      }
      return next;
    });
  }

  function toggleRow(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }

      return next;
    });
  }

  function applyBulkCategory() {
    if (selected.size === 0) return;
    setRows((prev) =>
      prev.map((r, i) =>
        selected.has(i) ? { ...r, categoryId: bulkCatId || undefined } : r,
      ),
    );
    setSelected(new Set());
    setBulkCatId('');
  }

  // ── Per-row edits ─────────────────────────────────────────────────────────

  function setPayeeForRow(index: number, payeeName: string) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], payeeName };
      return next;
    });
  }

  function setCategoryForRow(index: number, categoryId: string) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], categoryId: categoryId || undefined };
      return next;
    });
  }

  // ── File parsing ───────────────────────────────────────────────────────────

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseErr(null);
    setRows([]);
    setSelected(new Set());
    setDescFilter('');
    setPayeeFilter('');

    startParse(async () => {
      try {
        // @ts-expect-error danfojs accepts File in browser but types expect string
        const df = await readCSV(file, { delimiter, header: true });
        const parsed = parseCsvDataFrame(df, format);
        if (parsed.length === 0) {
          setParseErr('No valid rows could be parsed from this file. Check the format and delimiter.');
          return;
        }
        setRows(parsed.map((r) => ({ ...r })));
      } catch (err) {
        setParseErr(err instanceof Error ? err.message : 'Failed to parse CSV');
      }
    });

    e.target.value = '';
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!accountId || rows.length === 0) return;

    startSave(async () => {
      const payload: { accountId: string; rows: ImportRow[] } = {
        accountId,
        rows: rows.map((r) => ({
          date: r.date,
          amount: r.amount,
          type: r.type,
          description: r.description,
          payeeName: r.payeeName,
          categoryId: r.categoryId,
        })),
      };

      const result = await importCsvAction(payload);
      if (result.success) {
        setSnackbar({ msg: `${result.data.imported} transaction(s) imported successfully.`, severity: 'success' });
        setRows([]);
        setSelected(new Set());
      } else {
        setSnackbar({ msg: result.error, severity: 'error' });
      }
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Configuration panel */}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 3, mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Import settings
        </Typography>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormControl size="small" fullWidth>
            <InputLabel>CSV format</InputLabel>
            <Select
              value={format}
              label="CSV format"
              onChange={(e) => { 
                const csvFormat = e.target.value as CsvFormat;
                
                if (csvFormat === 'paypal') {
                  setDelimiter(",");
                } else {
                  setDelimiter(";");
                }

                setFormat(csvFormat); 
                setRows([]); 
                setSelected(new Set()); 
              }}
            >
              {(Object.keys(FORMAT_LABELS) as CsvFormat[]).map((f) => (
                <MenuItem key={f} value={f}>{FORMAT_LABELS[f]}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Delimiter"
            value={delimiter}
            onChange={(e) => { setDelimiter(e.target.value); setRows([]); setSelected(new Set()); }}
            maxRows={3}
            fullWidth
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Target account</InputLabel>
            <Select
              value={accountId}
              label="Target account"
              onChange={(e) => setAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            disabled={isParsing || !accountId}
            fullWidth
            sx={{ height: 40, alignSelf: 'center' }}
          >
            {isParsing ? 'Parsing…' : 'Choose CSV file'}
            <input type="file" accept=".csv,text/csv" hidden onChange={handleFile} />
          </Button>
        </div>
      </Paper>

      {parseErr && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setParseErr(null)}>
          {parseErr}
        </Alert>
      )}

      {rows.length > 0 && (
        <>
          {/* Header bar: row count + confirm button */}
          <div className="flex items-center justify-between mb-3">
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Preview — {rows.length} row{rows.length !== 1 ? 's' : ''} parsed
            </Typography>
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={handleSave}
              disabled={isSaving || !accountId}
              size="small"
            >
              {isSaving ? 'Saving…' : 'Confirm import'}
            </Button>
          </div>

          {/* Filter bar */}
          <Box className="flex flex-wrap items-end gap-3 mb-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <TextField
              size="small"
              label="Search description"
              value={descFilter}
              onChange={(e) => setDescFilter(e.target.value)}
              sx={{ minWidth: 220 }}
              placeholder="Type to filter…"
            />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Payee</InputLabel>
              <Select
                label="Payee"
                value={payeeFilter}
                onChange={(e) => setPayeeFilter(e.target.value)}
              >
                <MenuItem value=""><em>All payees</em></MenuItem>
                {uniquePayees.map((name) => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {hasFilter && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<FilterListOffIcon />}
                onClick={() => { setDescFilter(''); setPayeeFilter(''); }}
              >
                Clear
              </Button>
            )}

            {hasFilter && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', alignSelf: 'center' }}>
                Showing {visibleRows.length} of {rows.length}
              </Typography>
            )}
          </Box>

          {/* Bulk-category toolbar — visible only when rows are selected */}
          <Collapse in={selected.size > 0}>
            <Paper
              variant="outlined"
              sx={{ borderRadius: 2, mb: 2, bgcolor: 'primary.50', borderColor: 'primary.200' }}
            >
              <Toolbar variant="dense" sx={{ gap: 2, flexWrap: 'wrap', py: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', mr: 1 }}>
                  {selected.size} row{selected.size !== 1 ? 's' : ''} selected
                </Typography>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Set category</InputLabel>
                  <Select
                    value={bulkCatId}
                    label="Set category"
                    onChange={(e) => setBulkCatId(e.target.value)}
                    displayEmpty
                    renderValue={(val) => {
                      if (!val) return <em style={{ color: 'inherit' }}></em>;
                      const cat = categories.find((c) => c.id === val);
                      return cat ? <CategoryChip cat={cat} /> : null;
                    }}
                  >
                    <MenuItem value=""></MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        <CategoryChip cat={cat} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Tooltip title="Apply category to selected rows">
                  <span>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<LabelIcon />}
                      onClick={applyBulkCategory}
                    >
                      Apply
                    </Button>
                  </span>
                </Tooltip>

                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  onClick={() => setSelected(new Set())}
                  sx={{ ml: 'auto' }}
                >
                  Deselect all
                </Button>
              </Toolbar>
            </Paper>
          </Collapse>

          {/* Preview table */}
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.50' } }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      onChange={toggleAll}
                    />
                  </TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Payee</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Category</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.map(({ row, idx }) => {
                  const isSelected = selected.has(idx);
                  const chip = TYPE_CHIP[row.type] ?? { label: row.type, color: 'info' as const };
                  return (
                    <TableRow
                      key={idx}
                      hover
                      selected={isSelected}
                      onClick={() => toggleRow(idx)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox size="small" checked={isSelected} onChange={() => toggleRow(idx)} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                          {fmtDate(row.date)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {row.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={chip.label} color={chip.color} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} sx={{ minWidth: 160 }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={row.payeeName}
                          onChange={(e) => setPayeeForRow(idx, e.target.value)}
                          slotProps={{ input: { sx: { fontSize: '0.875rem' } } }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                          color={row.type === 'INCOME' ? 'success.main' : row.type === 'EXPENSE' ? 'error.main' : 'text.primary'}
                        >
                          {row.type === 'EXPENSE' ? '-' : row.type === 'INCOME' ? '+' : ''}
                          {Math.abs(row.amount).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <FormControl size="small" fullWidth>
                          <Select
                            displayEmpty
                            value={row.categoryId ?? ''}
                            onChange={(e) => setCategoryForRow(idx, e.target.value)}
                            renderValue={(val) => {
                              if (!val) return <Typography variant="body2" color="text.disabled">— none —</Typography>;
                              const cat = categories.find((c) => c.id === val);
                              return cat ? <CategoryChip cat={cat} /> : null;
                            }}
                          >
                            <MenuItem value=""><em>— none —</em></MenuItem>
                            {categories.map((cat) => (
                              <MenuItem key={cat.id} value={cat.id}>
                                <CategoryChip cat={cat} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box className="flex justify-end mt-4">
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={handleSave}
              disabled={isSaving || !accountId}
            >
              {isSaving ? 'Saving…' : 'Confirm import'}
            </Button>
          </Box>
        </>
      )}

      {rows.length === 0 && !parseErr && (
        <Box className="flex flex-col items-center justify-center py-24 gap-2 text-center">
          <UploadFileIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography variant="h6" color="text.secondary">No file loaded</Typography>
          <Typography variant="body2" color="text.secondary">
            Select a format, configure the delimiter and account, then choose a CSV file.
          </Typography>
        </Box>
      )}

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
