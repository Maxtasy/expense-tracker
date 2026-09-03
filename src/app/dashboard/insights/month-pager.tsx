import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthKey, monthLabel, shiftMonth, type YearMonth } from "@/lib/month";

function hrefFor(target: YearMonth) {
  return `/dashboard/insights?mode=month&month=${monthKey(target)}`;
}

export function InsightsMonthPager({ current }: { current: YearMonth }) {
  const prev = shiftMonth(current, -1);
  const next = shiftMonth(current, 1);

  return (
    <div className="mb-3 flex items-center justify-between rounded-xl border border-border bg-surface/30 px-1 py-1.5">
      <Link href={hrefFor(prev)} aria-label="Previous month" className="rounded-lg p-1.5 text-fg-muted hover:text-fg">
        <ChevronLeft size={16} />
      </Link>
      <div className="flex items-center gap-2 text-sm">
        <Link href={hrefFor(prev)} className="px-1 text-xs text-fg-muted hover:text-fg">
          {monthLabel(prev, "short")}
        </Link>
        <span className="rounded-full bg-accent/15 px-3 py-1 font-medium text-accent">{monthLabel(current)}</span>
        <Link href={hrefFor(next)} className="px-1 text-xs text-fg-muted hover:text-fg">
          {monthLabel(next, "short")}
        </Link>
      </div>
      <Link href={hrefFor(next)} aria-label="Next month" className="rounded-lg p-1.5 text-fg-muted hover:text-fg">
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
