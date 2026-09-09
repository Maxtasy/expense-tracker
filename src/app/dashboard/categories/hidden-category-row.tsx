"use client";

import { Eye } from "lucide-react";
import { unhideCategory } from "./actions";
import { categoryColor } from "@/lib/category-color";

type Category = { id: string; name: string; type: "expense" | "income" };

export function HiddenCategoryRow({ category }: { category: Category }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-1 py-2.5 last:border-b-0">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(category.name) }} aria-hidden="true" />
      <span className="flex-1 text-sm text-fg-muted">{category.name}</span>
      <form action={unhideCategory} className="contents">
        <input type="hidden" name="categoryId" value={category.id} />
        <button type="submit" className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-fg-muted hover:text-fg">
          <Eye size={14} />
          Unhide
        </button>
      </form>
    </div>
  );
}
