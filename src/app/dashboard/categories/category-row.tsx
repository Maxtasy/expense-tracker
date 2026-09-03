"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { updateCategory, deleteCategory } from "./actions";
import { categoryColor } from "@/lib/category-color";

type Category = { id: string; name: string; type: "expense" | "income"; userId: string | null };

const inputClass = "w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-fg focus:border-accent focus:outline-none";

export function CategoryRow({ category }: { category: Category }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const isGlobal = category.userId === null;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateCategory(null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setIsEditing(false);
      }
    });
  }

  if (isGlobal) {
    return (
      <div className="flex items-center gap-3 border-b border-border/60 px-1 py-2.5 last:border-b-0">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(category.name) }} aria-hidden="true" />
        <span className="flex-1 text-sm text-fg">{category.name}</span>
        <span className="text-xs text-fg-muted">Default</span>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3 border-b border-border/60 px-1 py-2.5 last:border-b-0">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(category.name) }} aria-hidden="true" />
        <span className="flex-1 text-sm text-fg">{category.name}</span>
        <div className="flex shrink-0 items-center gap-2 text-fg-muted">
          <button type="button" onClick={() => setIsEditing(true)} aria-label="Edit" className="hover:text-fg">
            <Pencil size={15} />
          </button>
          <form action={deleteCategory} className="contents">
            <input type="hidden" name="id" value={category.id} />
            <button type="submit" aria-label="Delete" className="hover:text-danger">
              <Trash2 size={15} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border/60 py-2.5 last:border-b-0">
      <form action={handleSubmit} className="flex items-center gap-2">
        <input type="hidden" name="id" value={category.id} />
        <input name="name" type="text" required defaultValue={category.name} maxLength={50} className={inputClass} />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-60"
        >
          {isPending ? "..." : "Save"}
        </button>
        <button type="button" onClick={() => setIsEditing(false)} className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-fg-muted hover:text-fg">
          Cancel
        </button>
      </form>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
