import { getTranslations, getLocale } from "next-intl/server";
import { formatMoney } from "@/lib/currency";

type Slice = { name: string; value: number; color: string };

export async function CategoryBarList({ title, data, currency }: { title: string; data: Slice[]; currency: string }) {
  const [t, locale] = await Promise.all([getTranslations("insights"), getLocale()]);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const max = data.reduce((m, d) => Math.max(m, d.value), 0);

  return (
    <div className="mb-3 rounded-xl border border-border bg-surface/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-fg">{title}</h2>
        <span className="text-sm font-medium text-fg">{formatMoney(total, currency, locale)}</span>
      </div>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-fg-muted">{t("noData")}</p>
      ) : (
        <div className="space-y-2.5">
          {data.map((slice) => {
            const pct = total > 0 ? (slice.value / total) * 100 : 0;
            const widthPct = max > 0 ? (slice.value / max) * 100 : 0;
            return (
              <div key={slice.name}>
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="min-w-0 flex-1 truncate text-fg">{slice.name}</span>
                  <span className="shrink-0 text-fg-muted">{pct.toFixed(0)}%</span>
                  <span className="w-20 shrink-0 text-right font-medium text-fg">{formatMoney(slice.value, currency, locale)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                  <div className="h-full rounded-full" style={{ width: `${widthPct}%`, backgroundColor: slice.color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
