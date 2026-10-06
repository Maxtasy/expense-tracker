// A spreadsheet treats a cell starting with = + - @ (or tab / CR) as a formula, so a description like
// "=HYPERLINK(...)" in an exported CSV would run when the file is opened. Exports prefix such cells
// with an apostrophe (the spreadsheet convention for "plain text"); imports strip it again so a
// round trip returns the original text.
const FORMULA_START = /^[=+\-@\t\r]/;

export function guardCsvCell(value: string): string {
  return FORMULA_START.test(value) ? `'${value}` : value;
}

export function unguardCsvCell(value: string): string {
  return value.startsWith("'") && FORMULA_START.test(value.slice(1)) ? value.slice(1) : value;
}
