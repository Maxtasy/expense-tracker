import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthKey, type YearMonth } from "@/lib/month";

function hrefFor(current: YearMonth, year: number, type: "expense" | "income") {
  return `/dashboard/insights?mode=year&month=${monthKey({ year, month: current.month })}&type=${type}`;
}

export function YearPager({ current, type }: { current: YearMonth; type: "expense" | "income" }) {
  const prevYear = current.year - 1;
  const nextYear = current.year + 1;

  return (
    <div className="mb-3 flex items-center justify-between rounded-xl border border-border bg-surface/30 px-1 py-1.5">
      <Link href={hrefFor(current, prevYear, type)} aria-label="Previous year" className="rounded-lg p-1.5 text-fg-muted hover:text-fg">
        <ChevronLeft size={16} />
      </Link>
      <div className="flex items-center gap-2 text-sm">
        <Link href={hrefFor(current, prevYear, type)} className="px-1 text-xs text-fg-muted hover:text-fg">
          {prevYear}
        </Link>
        <span className="rounded-full bg-accent/15 px-3 py-1 font-medium text-accent">{current.year}</span>
        <Link href={hrefFor(current, nextYear, type)} className="px-1 text-xs text-fg-muted hover:text-fg">
          {nextYear}
        </Link>
      </div>
      <Link href={hrefFor(current, nextYear, type)} aria-label="Next year" className="rounded-lg p-1.5 text-fg-muted hover:text-fg">
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
