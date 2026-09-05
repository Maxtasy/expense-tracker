"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthHref, monthLabel, shiftMonth, type YearMonth } from "@/lib/month";
import { useNavigate } from "./swipe-month-nav";

export function MonthPager({ current, category, sort }: { current: YearMonth; category: string; sort: string }) {
  const navigate = useNavigate();
  const prev = shiftMonth(current, -1);
  const next = shiftMonth(current, 1);

  return (
    <div className="mb-3 flex items-center justify-between rounded-xl border border-border bg-surface/30 px-1 py-1.5">
      <button
        type="button"
        onClick={() => navigate(monthHref(prev, category, sort))}
        aria-label="Previous month"
        className="rounded-lg p-1.5 text-fg-muted hover:text-fg"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => navigate(monthHref(prev, category, sort))}
          className="px-1 text-xs text-fg-muted hover:text-fg"
        >
          {monthLabel(prev, "short")}
        </button>
        <span className="rounded-full bg-accent/15 px-3 py-1 font-medium text-accent">{monthLabel(current)}</span>
        <button
          type="button"
          onClick={() => navigate(monthHref(next, category, sort))}
          className="px-1 text-xs text-fg-muted hover:text-fg"
        >
          {monthLabel(next, "short")}
        </button>
      </div>
      <button
        type="button"
        onClick={() => navigate(monthHref(next, category, sort))}
        aria-label="Next month"
        className="rounded-lg p-1.5 text-fg-muted hover:text-fg"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
