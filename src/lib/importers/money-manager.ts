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
  skippedOtherCurrency: number;
  skippedInvalid: number;
};

// Thrown for a file that can't be imported at all; the calling Server Action turns the code into a
// translated message (this module has no access to the user's locale).
export class MoneyManagerParseError extends Error {
  constructor(
    public code: "unreadable" | "noSheets" | "missingColumn",
    public column?: string,
  ) {
    super(code);
  }
}

// Money Manager writes its column headers and the Expense/Income labels in the language of the phone
// it was exported from, so each field accepts the known spellings (lowercased) for our five locales.
// The amount column is named after the currency code itself ("EUR", "USD", ...).
const HEADER_ALIASES = {
  date: ["datum", "date", "fecha", "data"],
  category: ["kategorie", "category", "categoría", "categoria", "catégorie"],
  note: ["notiz", "note", "notes", "nota", "notas"],
  type: ["einnahmen/ausgaben", "income/expense", "ingreso/gasto", "ingresos/gastos", "revenu/dépense", "receita/despesa", "receitas/despesas"],
  currency: ["währung", "currency", "moneda", "devise", "moeda"],
} as const;

const TYPE_MAP: Record<string, MoneyManagerType> = {
  ausgabe: "expense",
  einkommen: "income",
  expense: "expense",
  income: "income",
  gasto: "expense",
  ingreso: "income",
  dépense: "expense",
  depense: "expense",
  revenu: "income",
  despesa: "expense",
  receita: "income",
};

// currencyCode is the user's currency setting: rows in any other currency are skipped.
export async function parseMoneyManagerFile(buffer: ArrayBuffer, currencyCode: string): Promise<ParsedMoneyManagerFile> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new MoneyManagerParseError("unreadable");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new MoneyManagerParseError("noSheets");

  const columnIndex = new Map<string, number>();
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const value = typeof cell.value === "string" ? cell.value.trim().toLowerCase() : "";
    if (value && !columnIndex.has(value)) columnIndex.set(value, colNumber);
  });

  const findColumn = (aliases: readonly string[]) => {
    for (const alias of aliases) {
      const col = columnIndex.get(alias);
      if (col) return col;
    }
    return undefined;
  };

  const dateCol = findColumn(HEADER_ALIASES.date);
  const categoryCol = findColumn(HEADER_ALIASES.category);
  const noteCol = findColumn(HEADER_ALIASES.note);
  const typeCol = findColumn(HEADER_ALIASES.type);
  const currencyCol = findColumn(HEADER_ALIASES.currency);
  const amountCol = columnIndex.get(currencyCode.toLowerCase());

  if (!dateCol) throw new MoneyManagerParseError("missingColumn", HEADER_ALIASES.date[1]);
  if (!categoryCol) throw new MoneyManagerParseError("missingColumn", HEADER_ALIASES.category[1]);
  if (!typeCol) throw new MoneyManagerParseError("missingColumn", HEADER_ALIASES.type[1]);
  if (!currencyCol) throw new MoneyManagerParseError("missingColumn", HEADER_ALIASES.currency[1]);
  if (!amountCol) throw new MoneyManagerParseError("missingColumn", currencyCode);

  const rows: ParsedMoneyManagerRow[] = [];
  const categoryCounts = new Map<string, CategorySummaryEntry>();
  let skippedOtherCurrency = 0;
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

    if (typeof currencyValue === "string" && currencyValue.trim().toUpperCase() !== currencyCode.toUpperCase()) {
      skippedOtherCurrency++;
      continue;
    }

    const type = typeof typeValue === "string" ? TYPE_MAP[typeValue.trim().toLowerCase()] : undefined;
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
    skippedOtherCurrency,
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
