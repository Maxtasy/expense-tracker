type Category = { id: string; name: string };

const fieldClass =
  "w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-fg focus:border-accent focus:outline-none";

export function ExpenseFilters({
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
  return (
    <form method="get" className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface/30 p-3 text-fg-muted">
      <input type="hidden" name="month" value={month} />
      <label className="space-y-1">
        <span className="block text-[11px]">Category</span>
        <select name="category" defaultValue={category} className={fieldClass}>
          <option value="">All categories</option>
          <option value="uncategorized">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="block text-[11px]">Sort by</span>
        <select name="sort" defaultValue={sort} className={fieldClass}>
          <option value="date-desc">Newest</option>
          <option value="date-asc">Oldest</option>
          <option value="amount-desc">Amount high-low</option>
          <option value="amount-asc">Amount low-high</option>
          <option value="category">Category A-Z</option>
        </select>
      </label>
      <div className="col-span-2 flex gap-2">
        <button type="submit" className="flex-1 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-fg hover:bg-accent-hover">
          Apply
        </button>
        <a href="/dashboard" className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-center text-xs hover:text-fg">
          Reset
        </a>
      </div>
    </form>
  );
}
