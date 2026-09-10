"use client";

import { useRef, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { deleteRecurring } from "./actions";
import { categoryColor } from "@/lib/category-color";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/month";
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
  categoryColor: string | null;
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
  const t = useTranslations("recurring");
  const tCommon = useTranslations("common");
  const locale = useLocale();
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
        style={{ backgroundColor: categoryColor(recurring.categoryName, recurring.categoryColor) }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-fg">{recurring.description || recurring.categoryName || t("fallbackName")}</p>
        <p className="text-xs text-fg-muted">
          {recurring.categoryName ?? tCommon("uncategorized")} &middot; {t("dayOfMonth", { day })}
          {recurring.endDate ? t("until", { date: formatDate(recurring.endDate, locale) }) : ""}
        </p>
      </div>
      <span className={`shrink-0 text-sm font-medium ${isIncome ? "text-success" : "text-fg"}`}>
        {isIncome ? "+" : "-"}
        {formatMoney(recurring.amount, currency, locale)}
      </span>
      <div className="flex shrink-0 items-center gap-2 text-fg-muted">
        <button type="button" onClick={() => dialogRef.current?.showModal()} aria-label={tCommon("edit")} className="rounded-lg p-1.5 hover:text-fg">
          <Pencil size={15} />
        </button>
        <form action={handleDelete} className="contents">
          <input type="hidden" name="id" value={recurring.id} />
          <button type="submit" disabled={isDeleting} aria-label={tCommon("delete")} className="rounded-lg p-1.5 hover:text-danger disabled:opacity-60">
            {isDeleting ? <Spinner size={15} /> : <Trash2 size={15} />}
          </button>
        </form>
      </div>

      <Dialog dialogRef={dialogRef} title={t("editTitle")}>
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
