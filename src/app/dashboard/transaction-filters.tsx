"use client";

import { useRef } from "react";
import { RotateCcw } from "lucide-react";

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
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      method="get"
      className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-surface/30 p-3 text-fg-muted"
    >
      <input type="hidden" name="month" value={month} />
      <select
        key={category}
        name="category"
        defaultValue={category}
        onChange={() => formRef.current?.requestSubmit()}
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
        name="sort"
        defaultValue={sort}
        onChange={() => formRef.current?.requestSubmit()}
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
    </form>
  );
}
