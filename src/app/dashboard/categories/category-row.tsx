"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { updateCategory, deleteCategory } from "./actions";
import { categoryColor } from "@/lib/category-color";
import { Spinner } from "@/components/spinner";

type Category = { id: string; name: string; type: "expense" | "income"; userId: string | null; color: string | null };

const inputClass = "w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-fg focus:border-accent focus:outline-none";

export function CategoryRow({ category }: { category: Category }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [color, setColor] = useState<string | null>(category.color);
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

  function handleDelete(formData: FormData) {
    startTransition(async () => {
      await deleteCategory(formData);
    });
  }

  if (isGlobal) {
    return (
      <div className="flex items-center gap-3 border-b border-border/60 px-1 py-2.5 last:border-b-0">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: categoryColor(category.name, category.color) }}
          aria-hidden="true"
        />
        <span className="flex-1 text-sm text-fg">{category.name}</span>
        <span className="text-xs text-fg-muted">Default</span>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3 border-b border-border/60 px-1 py-2.5 last:border-b-0">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: categoryColor(category.name, category.color) }}
          aria-hidden="true"
        />
        <span className="flex-1 text-sm text-fg">{category.name}</span>
        <div className="flex shrink-0 items-center gap-2 text-fg-muted">
          <button type="button" onClick={() => setIsEditing(true)} aria-label="Edit" className="rounded-lg p-1.5 hover:text-fg">
            <Pencil size={15} />
          </button>
          <form action={handleDelete} className="contents">
            <input type="hidden" name="id" value={category.id} />
            <button type="submit" disabled={isPending} aria-label="Delete" className="rounded-lg p-1.5 hover:text-danger disabled:opacity-60">
              {isPending ? <Spinner size={15} /> : <Trash2 size={15} />}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border/60 py-2.5 last:border-b-0">
      <form action={handleSubmit} className="space-y-2">
        <input type="hidden" name="id" value={category.id} />
        <input type="hidden" name="color" value={color ?? ""} />
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label="Category color"
            value={color ?? categoryColor(category.name)}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border border-border bg-surface p-0.5"
          />
          <input name="name" type="text" required aria-label="Category name" defaultValue={category.name} maxLength={50} className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
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
          {color !== null && (
            <button type="button" onClick={() => setColor(null)} className="shrink-0 text-xs text-fg-muted hover:text-fg">
              Auto color
            </button>
          )}
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      </form>
    </div>
  );
}
