export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "NZD", symbol: "$", name: "New Zealand Dollar" },
  { code: "SGD", symbol: "$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "$", name: "Hong Kong Dollar" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
] as const;

export const DEFAULT_CURRENCY = "EUR";

// USD keeps "$" and JPY "¥"; every other currency whose symbol is shared ("$", "¥", "kr") shows
// its code instead, so e.g. CAD and AUD aren't indistinguishable from USD in the amount field.
const CANONICAL_SYMBOL_CODES: readonly string[] = ["USD", "JPY"];

export function currencySymbol(code: string): string {
  const entry = CURRENCIES.find((c) => c.code === code);
  if (!entry) return code;
  const shared = CURRENCIES.some((c) => c.code !== code && c.symbol === entry.symbol);
  return shared && !CANONICAL_SYMBOL_CODES.includes(code) ? code : entry.symbol;
}

export function currencyName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code;
  } catch {
    return CURRENCIES.find((c) => c.code === code)?.name ?? code;
  }
}

export function formatMoney(amount: number | string, code: string, locale: string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(n);
}
