import type { DataFrame } from 'danfojs';
import { toJSON } from 'danfojs';
import { parseLineBankAustria } from './bank-austria-parser';
import { parseLinePaypal } from './paypal-parser';

export type CsvFormat = 'bank-austria' | 'paypal';

export interface ParsedRow {
  date: Date;           // ISO date string YYYY-MM-DD
  amount: number;       // positive = INCOME, negative = EXPENSE
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  description: string;
  payeeName: string;
  payeeEmail?: string;
}

type LineParseFn = (line: Record<string, string>) => ParsedRow | null;

const parsers: Record<CsvFormat, LineParseFn> = {
  'bank-austria': parseLineBankAustria,
  paypal: parseLinePaypal,
};

export function parseCsvDataFrame(df: DataFrame, format: CsvFormat): ParsedRow[] {
  const parse = parsers[format];
  const rows: ParsedRow[] = [];

  const jsonRows = toJSON(df) as Record<string, string>[];

  for (const row of jsonRows) {
    const parsed = parse(row);
    if (parsed !== null) rows.push(parsed);
  }

  return rows;
}
