"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNavigate } from "./swipe-month-nav";

type Category = { id: string; name: string; type: "expense" | "income" };

const fieldClass =
  "w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-fg focus:border-accent focus:outline-none";

export function TransactionFilters({
  categories,
  category,
  sort,
  month,
}: {
  categories: Category[];
  category: string;
  sort: string;
  month: string;
}) {
  const t = useTranslations("dashboard.filters");
  const tCommon = useTranslations("common");
  const navigate = useNavigate();

  function go(next: { category?: string; sort?: string }) {
    const params = new URLSearchParams();
    params.set("month", month);
    const nextCategory = next.category ?? category;
    const nextSort = next.sort ?? sort;
    if (nextCategory) params.set("category", nextCategory);
    if (nextSort) params.set("sort", nextSort);
    navigate(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-surface/30 p-3 text-fg-muted">
      <select
        key={category}
        defaultValue={category}
        onChange={(e) => go({ category: e.target.value })}
        aria-label={t("filterByCategory")}
        className={`flex-1 ${fieldClass}`}
      >
        <option value="">{t("allCategories")}</option>
        <option value="uncategorized">{tCommon("uncategorized")}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        key={sort}
        defaultValue={sort}
        onChange={(e) => go({ sort: e.target.value })}
        aria-label={t("sortBy")}
        className={`flex-1 ${fieldClass}`}
      >
        <option value="date-desc">{t("newest")}</option>
        <option value="date-asc">{t("oldest")}</option>
        <option value="amount-desc">{t("amountHighLow")}</option>
        <option value="amount-asc">{t("amountLowHigh")}</option>
        <option value="category">{t("categoryAZ")}</option>
      </select>
      {/* Plain <a>, not next/link: this should always be a full, guaranteed-fresh reset —
          Link's client-side prefetch/router cache has been observed serving a stale render
          for this route in dev. */}
      <a href="/dashboard" aria-label={t("resetFilters")} className="shrink-0 rounded-lg p-1.5 text-fg-muted hover:text-fg">
        <RotateCcw size={16} />
      </a>
    </div>
  );
}
