import ExcelJS from "exceljs";

export type MoneyManagerType = "expense" | "income";

export type ParsedMoneyManagerRow = {
  date: string; // YYYY-MM-DD
  categoryName: string;
  type: MoneyManagerType;
  amount: string; // e.g. "30.00"
  description: string | null;
};

export type CategorySummaryEntry = {
  name: string;
  type: MoneyManagerType;
  count: number;
};

export type ParsedMoneyManagerFile = {
  rows: ParsedMoneyManagerRow[];
  categorySummary: CategorySummaryEntry[];
  dateRange: { min: string; max: string } | null;
  skippedNonEur: number;
  skippedInvalid: number;
};

const TYPE_MAP: Record<string, MoneyManagerType> = {
  Ausgabe: "expense",
  Einkommen: "income",
};

const REQUIRED_HEADERS = ["Datum", "Kategorie", "EUR", "Einnahmen/Ausgaben", "Währung"] as const;

export async function parseMoneyManagerFile(buffer: ArrayBuffer): Promise<ParsedMoneyManagerFile> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new Error("Could not read this file as an .xlsx export");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("The file has no sheets");

  const columnIndex = new Map<string, number>();
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const value = typeof cell.value === "string" ? cell.value.trim() : "";
    if (value && !columnIndex.has(value)) columnIndex.set(value, colNumber);
  });

  for (const header of REQUIRED_HEADERS) {
    if (!columnIndex.has(header)) {
      throw new Error(`This doesn't look like a Money Manager export — missing column "${header}"`);
    }
  }

  const dateCol = columnIndex.get("Datum")!;
  const categoryCol = columnIndex.get("Kategorie")!;
  const noteCol = columnIndex.get("Notiz");
  const amountCol = columnIndex.get("EUR")!;
  const typeCol = columnIndex.get("Einnahmen/Ausgaben")!;
  const currencyCol = columnIndex.get("Währung")!;

  const rows: ParsedMoneyManagerRow[] = [];
  const categoryCounts = new Map<string, CategorySummaryEntry>();
  let skippedNonEur = 0;
  let skippedInvalid = 0;
  let minDate: string | null = null;
  let maxDate: string | null = null;

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const dateValue = row.getCell(dateCol).value;
    const categoryValue = row.getCell(categoryCol).value;
    const amountValue = row.getCell(amountCol).value;
    const typeValue = row.getCell(typeCol).value;
    const currencyValue = row.getCell(currencyCol).value;
    const noteValue = noteCol ? row.getCell(noteCol).value : null;

    if (!dateValue && !categoryValue && !amountValue) continue; // fully blank row

    if (typeof currencyValue === "string" && currencyValue.trim() !== "EUR") {
      skippedNonEur++;
      continue;
    }

    const type = typeof typeValue === "string" ? TYPE_MAP[typeValue.trim()] : undefined;
    const categoryName = typeof categoryValue === "string" ? categoryValue.trim() : "";
    const amountNumber = typeof amountValue === "number" ? amountValue : Number(amountValue);
    const date = dateValue instanceof Date ? toDateString(dateValue) : null;

    if (!type || !categoryName || !date || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      skippedInvalid++;
      continue;
    }

    const description = typeof noteValue === "string" && noteValue.trim() ? noteValue.trim() : null;

    rows.push({ date, categoryName, type, amount: amountNumber.toFixed(2), description });

    const key = `${type}:${categoryName.toLowerCase()}`;
    const existing = categoryCounts.get(key);
    if (existing) existing.count++;
    else categoryCounts.set(key, { name: categoryName, type, count: 1 });

    if (!minDate || date < minDate) minDate = date;
    if (!maxDate || date > maxDate) maxDate = date;
  }

  return {
    rows,
    categorySummary: [...categoryCounts.values()].sort((a, b) => b.count - a.count),
    dateRange: minDate && maxDate ? { min: minDate, max: maxDate } : null,
    skippedNonEur,
    skippedInvalid,
  };
}

// Excel serial dates carry no timezone; exceljs anchors them at UTC midnight,
// so extracting local (non-UTC) parts could shift the date by a day on some servers.
function toDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
