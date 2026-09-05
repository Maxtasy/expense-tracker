type Props = {
  symbol: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  size?: "sm" | "md";
};

export function AmountInput({ symbol, name = "amount", defaultValue, placeholder = "0.00", required, size = "md" }: Props) {
  const padY = size === "sm" ? "py-1.5" : "py-2";
  const textSize = size === "sm" ? "text-sm" : "text-sm";

  return (
    <div className="relative">
      <span
        className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-fg-muted ${textSize}`}
      >
        {symbol}
      </span>
      <input
        name={name}
        type="number"
        step="0.01"
        min="0.01"
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className={`w-full rounded-lg border border-border bg-surface ${padY} pl-9 pr-3 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none`}
      />
    </div>
  );
}
