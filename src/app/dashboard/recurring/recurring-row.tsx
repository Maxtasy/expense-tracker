"use client";

import { useRef, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteRecurring } from "./actions";
import { categoryColor } from "@/lib/category-color";
import { formatMoney } from "@/lib/currency";
import { Spinner } from "@/components/spinner";
import { Dialog } from "../dialog";
import { EditRecurringForm } from "./edit-recurring-form";

type TxType = "expense" | "income";
type Category = { id: string; name: string; type: TxType };
type Recurring = {
  id: string;
  type: TxType;
  amount: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  startDate: string;
  endDate: string | null;
};

export function RecurringRow({
  recurring,
  categories,
  currency,
}: {
  recurring: Recurring;
  categories: Category[];
  currency: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDeleting, startDelete] = useTransition();

  function handleDelete(formData: FormData) {
    startDelete(async () => {
      await deleteRecurring(formData);
    });
  }

  const isIncome = recurring.type === "income";
  const day = recurring.startDate.split("-")[2];

  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-1 py-2.5 last:border-b-0">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: categoryColor(recurring.categoryName) }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-fg">{recurring.description || recurring.categoryName || "Recurring"}</p>
        <p className="text-xs text-fg-muted">
          {recurring.categoryName ?? "Uncategorized"} &middot; Day {day} of month
          {recurring.endDate ? ` · until ${recurring.endDate}` : ""}
        </p>
      </div>
      <span className={`shrink-0 text-sm font-medium ${isIncome ? "text-success" : "text-fg"}`}>
        {isIncome ? "+" : "-"}
        {formatMoney(recurring.amount, currency)}
      </span>
      <div className="flex shrink-0 items-center gap-2 text-fg-muted">
        <button type="button" onClick={() => dialogRef.current?.showModal()} aria-label="Edit" className="rounded-lg p-1.5 hover:text-fg">
          <Pencil size={15} />
        </button>
        <form action={handleDelete} className="contents">
          <input type="hidden" name="id" value={recurring.id} />
          <button type="submit" disabled={isDeleting} aria-label="Delete" className="rounded-lg p-1.5 hover:text-danger disabled:opacity-60">
            {isDeleting ? <Spinner size={15} /> : <Trash2 size={15} />}
          </button>
        </form>
      </div>

      <Dialog dialogRef={dialogRef} title="Edit recurring transaction">
        <EditRecurringForm
          recurring={recurring}
          categories={categories}
          currency={currency}
          onSuccess={() => dialogRef.current?.close()}
        />
      </Dialog>
    </div>
  );
}
