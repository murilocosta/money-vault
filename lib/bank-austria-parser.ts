import { formatISO, parse  } from "date-fns";
import type { ParsedRow } from './csv-parser';

type BankAustriaCategory = "SEPA" | "POS" | "ATM" | "UBERWEISUNG" | "ONLINE" | "OTHER" | "GUTSCHRIFT" | "KONTOPAKET" | "BAREINZAHLUNG";

interface Detection {
  name: BankAustriaCategory;
  pattern: RegExp;
}

function parseBuchungsText(buchungsText: string): [string, string] {
  const detections: Detection[] = [
    { name: "SEPA", pattern: /(SEPA Lastschrift).*a\/(.*)/ },
    { name: "POS", pattern: /^(POS)\s+([-0-9,]+)\s+[a-zA-Z]+\s+[KD]1?1\s+([0-9.]*\s[0-9:]*)\s+O\s+(.{23})/ },
    { name: "ATM", pattern: /^(ATM)\s+([-0-9,]+)\s+[a-zA-Z]+\s+[KD]1?1\s+([0-9.]*\s[0-9:]*)\s+O\s+(.{23})/ },
    { name: "UBERWEISUNG", pattern: /^([ÜU]berweisung)\s+zG\/(.*)(?=REF)/ },
    { name: "ONLINE", pattern: /^(Online((-Auftrag)|(\s[UÜ]berweisung))).*(?=zG\/)zG\/(.*)/ },
    { name: "OTHER", pattern: /^([A-Z'\s\-.\&]*?[A-Z0-9]+)(?=\d|\s+\d)/ },
    { name: "GUTSCHRIFT", pattern: /^(Gutschrift)\s+a\/(.*)(?=REF)/ },
    { name: "GUTSCHRIFT", pattern: /^(Gutschrift)\s+a\/(.*)/ },
    { name: "GUTSCHRIFT", pattern: /^(Echtzeitgutschrift)\s+a\/(.*)(?=LT|AT)/ },
    { name: "KONTOPAKET", pattern: /KONTOPAKET|PORTO/},
    { name: "BAREINZAHLUNG", pattern: /Bareinzahlung/}
  ];

  for (const { name, pattern } of detections) {
    const found = buchungsText.match(pattern);
    if (!found) continue;

    let description: string;
    let payee: string;

    switch (name) {
      case "GUTSCHRIFT":
      case "SEPA":
      case "UBERWEISUNG":
        description = found[1];
        payee = found[2].trim();
        break;

      case "POS":
      case "ATM":
        description = found[1];
        payee = found[4].trim();
        break;

      case "ONLINE":
        description = found[1];
        payee = found[5].trim();
        break;

      case "OTHER":
        description = "Debit Card Expense";
        payee = found[1].trim();
        break;

      case "KONTOPAKET":
        description = "Account Maintenance Fee"
        payee = "Bank Austria"
        break;

      case "BAREINZAHLUNG":
        description = "Money Deposit"
        payee = "Murilo Costa"
        break;

      default:
        description = "Other";
        payee = "Unknown";
    }

    return [description, payee];
  }

  return ["Other", "Unknown"];
}

function parseCurrencyAmount(currencyAmount: string): number {
  const cleanAmount = currencyAmount.replace(/\./g, '').replace(',', '.');
  const parsedAmount = parseFloat(cleanAmount);
  return isNaN(parsedAmount) ? 0 : parsedAmount;
}

export function parseLineBankAustria(line: Record<string, string>): ParsedRow | null {
  let description = null;
  let payeeName = null;
  [description, payeeName] = parseBuchungsText(line["Buchungstext"])

  const amount = parseCurrencyAmount(line["Betrag"]);
  const dateTime = parse(line["Buchungsdatum"], 'dd.MM.yyyy', new Date())

  return {
    date: formatISO(dateTime),
    amount: amount > 0 ? amount : amount * -1,
    type: amount > 0 ? 'INCOME' : 'EXPENSE',
    description: description,
    payeeName: payeeName,
  };
}
