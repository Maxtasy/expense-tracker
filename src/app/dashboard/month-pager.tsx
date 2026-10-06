"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { monthHref, monthLabel, shiftMonth, type YearMonth } from "@/lib/month";
import { useNavigate } from "./swipe-month-nav";

export function MonthPager({ current, category, sort }: { current: YearMonth; category: string; sort: string }) {
  const navigate = useNavigate();
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const prev = shiftMonth(current, -1);
  const next = shiftMonth(current, 1);

  return (
    <div className="mb-3 flex items-center justify-between rounded-xl border border-border bg-surface/30 px-1 py-1.5">
      <button
        type="button"
        onClick={() => navigate(monthHref(prev, category, sort))}
        aria-label={t("previousMonth")}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-fg-muted hover:text-fg"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => navigate(monthHref(prev, category, sort))}
          aria-label={t("goToMonth", { month: monthLabel(prev, locale) })}
          className="min-h-11 px-2 text-xs text-fg-muted hover:text-fg"
        >
          {monthLabel(prev, locale, "short")}
        </button>
        <span aria-live="polite" aria-atomic="true" className="rounded-md bg-accent/15 px-3 py-1 text-center font-medium text-accent-text">{monthLabel(current, locale)}</span>
        <button
          type="button"
          onClick={() => navigate(monthHref(next, category, sort))}
          aria-label={t("goToMonth", { month: monthLabel(next, locale) })}
          className="min-h-11 px-2 text-xs text-fg-muted hover:text-fg"
        >
          {monthLabel(next, locale, "short")}
        </button>
      </div>
      <button
        type="button"
        onClick={() => navigate(monthHref(next, category, sort))}
        aria-label={t("nextMonth")}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-fg-muted hover:text-fg"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
