"use client";

import { useState, useTransition } from "react";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { unhideCategory } from "./actions";
import { categoryColor } from "@/lib/category-color";
import { Spinner } from "@/components/spinner";

type Category = { id: string; name: string; type: "expense" | "income"; color: string | null };

export function HiddenCategoryRow({ category }: { category: Category }) {
  const t = useTranslations("categories");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleUnhide(formData: FormData) {
    startTransition(async () => {
      const result = await unhideCategory(formData);
      setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-1 py-2.5 last:border-b-0">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: categoryColor(category.name, category.color) }}
        aria-hidden="true"
      />
      <span className="flex-1 text-sm text-fg-muted">{category.name}</span>
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
      <form action={handleUnhide} className="contents">
        <input type="hidden" name="categoryId" value={category.id} />
        <button
          type="submit"
          disabled={isPending}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-fg-muted hover:text-fg disabled:opacity-60"
        >
          {isPending ? <Spinner size={14} /> : <Eye size={14} />}
          {t("unhide")}
        </button>
      </form>
    </div>
  );
}
