import Link from "next/link";

export function PeriodToggle({ mode, month }: { mode: "month" | "year"; month: string }) {
  const tabs: { key: "month" | "year"; label: string }[] = [
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
  ];

  return (
    <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface/30 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`/dashboard/insights?mode=${tab.key}&month=${month}`}
          className={`rounded-lg py-1.5 text-center text-sm font-medium transition ${
            mode === tab.key ? "bg-accent text-accent-fg" : "text-fg-muted hover:text-fg"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
