"use client";

import { RotateCcw } from "lucide-react";
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
        aria-label="Filter by category"
        className={`flex-1 ${fieldClass}`}
      >
        <option value="">All categories</option>
        <option value="uncategorized">Uncategorized</option>
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
        aria-label="Sort by"
        className={`flex-1 ${fieldClass}`}
      >
        <option value="date-desc">Newest</option>
        <option value="date-asc">Oldest</option>
        <option value="amount-desc">Amount high-low</option>
        <option value="amount-asc">Amount low-high</option>
        <option value="category">Category A-Z</option>
      </select>
      {/* Plain <a>, not next/link: this should always be a full, guaranteed-fresh reset —
          Link's client-side prefetch/router cache has been observed serving a stale render
          for this route in dev. */}
      <a href="/dashboard" aria-label="Reset filters" className="shrink-0 text-fg-muted hover:text-fg">
        <RotateCcw size={16} />
      </a>
    </div>
  );
}
