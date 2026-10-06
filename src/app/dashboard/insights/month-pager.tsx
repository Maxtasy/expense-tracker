import { ChevronLeft, ChevronRight } from "lucide-react";
import { InsightsLink } from "./insights-nav";
import { getTranslations, getLocale } from "next-intl/server";
import { monthKey, monthLabel, shiftMonth, type YearMonth } from "@/lib/month";

function hrefFor(target: YearMonth, type: "expense" | "income" | "all") {
  return `/dashboard/insights?mode=month&month=${monthKey(target)}&type=${type}`;
}

export async function InsightsMonthPager({ current, type }: { current: YearMonth; type: "expense" | "income" | "all" }) {
  const [t, locale] = await Promise.all([getTranslations("insights"), getLocale()]);
  const prev = shiftMonth(current, -1);
  const next = shiftMonth(current, 1);

  return (
    <div className="mb-3 flex items-center justify-between rounded-xl border border-border bg-surface/30 px-1 py-1.5">
      <InsightsLink href={hrefFor(prev, type)} aria-label={t("previousMonth")} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-fg-muted hover:text-fg">
        <ChevronLeft size={16} />
      </InsightsLink>
      <div className="flex items-center gap-2 text-sm">
        <InsightsLink href={hrefFor(prev, type)} aria-label={t("goToMonth", { month: monthLabel(prev, locale) })} className="inline-flex min-h-11 items-center px-2 text-xs text-fg-muted hover:text-fg">
          {monthLabel(prev, locale, "short")}
        </InsightsLink>
        <span aria-live="polite" aria-atomic="true" className="rounded-md bg-accent/15 px-3 py-1 text-center font-medium text-accent-text">{monthLabel(current, locale)}</span>
        <InsightsLink href={hrefFor(next, type)} aria-label={t("goToMonth", { month: monthLabel(next, locale) })} className="inline-flex min-h-11 items-center px-2 text-xs text-fg-muted hover:text-fg">
          {monthLabel(next, locale, "short")}
        </InsightsLink>
      </div>
      <InsightsLink href={hrefFor(next, type)} aria-label={t("nextMonth")} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-fg-muted hover:text-fg">
        <ChevronRight size={16} />
      </InsightsLink>
    </div>
  );
}
