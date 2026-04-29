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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ImportCsvClient({ accounts, categories }: Props) {
  const [format, setFormat] = useState<CsvFormat>('bank-austria');
  const [delimiter, setDelimiter] = useState(';');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [isParsing, startParse] = useTransition();
  const [isSaving, startSave] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseErr(null);
    setRows([]);

    startParse(async () => {
      try {
        // @ts-expect-error Somehow the inherited config object was not detected
        const df = await readCSV(file, { delimiter: delimiter, header: true });
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

    // Reset input so the same file can be re-selected after changing options
    e.target.value = '';
  }

  function setCategoryForRow(index: number, categoryId: string) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], categoryId: categoryId || undefined };
      return next;
    });
  }

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
      } else {
        setSnackbar({ msg: result.error, severity: 'error' });
      }
    });
  }

  return (
    <>
      {/* ── Configuration panel ── */}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 3, mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Import settings
        </Typography>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Format */}
          <FormControl size="small" fullWidth>
            <InputLabel>CSV format</InputLabel>
            <Select
              value={format}
              label="CSV format"
              onChange={(e) => { setFormat(e.target.value as CsvFormat); setRows([]); }}
            >
              {(Object.keys(FORMAT_LABELS) as CsvFormat[]).map((f) => (
                <MenuItem key={f} value={f}>{FORMAT_LABELS[f]}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Delimiter */}
          <TextField
            size="small"
            label="Delimiter"
            value={delimiter}
            onChange={(e) => { setDelimiter(e.target.value); setRows([]); }}
            maxRows={3}
            fullWidth
          />

          {/* Account */}
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

          {/* File picker */}
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

      {/* ── Preview table ── */}
      {rows.length > 0 && (
        <>
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

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.50' } }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Payee</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Category</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => {
                  const chip = TYPE_CHIP[row.type] ?? { label: row.type, color: 'info' as const };
                  return (
                    <TableRow key={idx} hover>
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
                      <TableCell>
                        <Typography variant="body2">{row.payeeName}</Typography>
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
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            displayEmpty
                            value={row.categoryId ?? ''}
                            onChange={(e) => setCategoryForRow(idx, e.target.value)}
                            renderValue={(val) => {
                              if (!val) return <Typography variant="body2" color="text.disabled">— none —</Typography>;
                              const cat = categories.find((c) => c.id === val);
                              return (
                                <div className="flex items-center gap-1">
                                  {cat?.color && (
                                    <span
                                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: cat.color }}
                                    />
                                  )}
                                  <Typography variant="body2">
                                    {cat?.icon ? `${cat.icon} ` : ''}{cat?.name}
                                  </Typography>
                                </div>
                              );
                            }}
                          >
                            <MenuItem value=""><em>— none —</em></MenuItem>
                            {categories.map((cat) => (
                              <MenuItem key={cat.id} value={cat.id}>
                                <div className="flex items-center gap-2">
                                  {cat.color && (
                                    <span
                                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: cat.color }}
                                    />
                                  )}
                                  {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                                </div>
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
