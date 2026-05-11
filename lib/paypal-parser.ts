import type { ParsedRow } from './csv-parser';

const TIMEZONE_OFFSETS: Record<string, string> = {
  CET: "+01:00",
  CEST: "+02:00",
  GMT: "+00:00",
  UTC: "+00:00",
  PST: "-08:00",
  PDT: "-07:00",
  EST: "-05:00",
  EDT: "-04:00",
};

export function parseLinePaypal(line: Record<string, string>): ParsedRow | null {
  if (line["Status"] !== "Abgeschlossen") return null;
  
  if (line["Auswirkung auf Guthaben"] === "Memo") return null;

  const net = parseAmount(line["Netto"]);
  const isExpense = line["Auswirkung auf Guthaben"].toUpperCase() == "SOLL";
  const description = line["Name"] ?? line["Artikelbezeichnung"];
  
  return {
    date: toTimestamp(line["Datum"], line["Uhrzeit"], line["Zeitzone"]),
    amount: net,
    type: isExpense ? "EXPENSE" : "INCOME",
    description: `${line["Typ"]} (${line["Währung"]})`,
    payeeName: description,
    payeeEmail: isExpense ? line["Empfänger E-Mail-Adresse"] : line["Absender E-Mail-Adresse"],
  };
}

function toTimestamp(date: string, time: string, tz: string): Date {
  const [day, month, year] = date.split(".");
  const offset = TIMEZONE_OFFSETS[tz.toUpperCase()] ?? "+00:00";
  const isoDate = `${year}-${month}-${day}T${time}${offset}`;
  return new Date(isoDate);
}

function parseAmount(value: string): number {
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
}