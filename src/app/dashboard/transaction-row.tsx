"use client";

import { useRef, useTransition } from "react";
import { Pencil, Trash2, Repeat } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { deleteTransaction } from "./actions";
import { categoryColor } from "@/lib/category-color";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/month";
import { Dialog } from "./dialog";
import { EditTransactionForm } from "./edit-transaction-form";
import { Spinner } from "@/components/spinner";

type TxType = "expense" | "income";
type Category = { id: string; name: string; type: TxType };
type Transaction = {
  id: string;
  type: TxType;
  amount: string;
  date: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  recurringTransactionId: string | null;
};

export function TransactionRow({
  transaction,
  categories,
  currency,
}: {
  transaction: Transaction;
  categories: Category[];
  currency: string;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDeleting, startDelete] = useTransition();
  const isIncome = transaction.type === "income";

  function handleDelete(formData: FormData) {
    startDelete(async () => {
      await deleteTransaction(formData);
    });
  }

  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-1 py-2.5 last:border-b-0">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: categoryColor(transaction.categoryName, transaction.categoryColor) }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm text-fg">
          {transaction.description || transaction.categoryName || t("row.fallbackName")}
          {transaction.recurringTransactionId && (
            <Repeat size={11} className="shrink-0 text-fg-muted" aria-label={t("row.recurringLabel")} />
          )}
        </p>
        <p className="text-xs text-fg-muted">
          {transaction.categoryName ?? tCommon("uncategorized")} &middot; {formatDate(transaction.date, locale)}
        </p>
      </div>
      <span className={`shrink-0 text-sm font-medium ${isIncome ? "text-success" : "text-fg"}`}>
        {isIncome ? "+" : "-"}
        {formatMoney(transaction.amount, currency, locale)}
      </span>
      <div className="flex shrink-0 items-center gap-2 text-fg-muted">
        <button type="button" onClick={() => dialogRef.current?.showModal()} aria-label={tCommon("edit")} className="rounded-lg p-1.5 hover:text-fg">
          <Pencil size={15} />
        </button>
        <form action={handleDelete} className="contents">
          <input type="hidden" name="id" value={transaction.id} />
          <button type="submit" disabled={isDeleting} aria-label={tCommon("delete")} className="rounded-lg p-1.5 hover:text-danger disabled:opacity-60">
            {isDeleting ? <Spinner size={15} /> : <Trash2 size={15} />}
          </button>
        </form>
      </div>

      <Dialog dialogRef={dialogRef} title={t("row.editTitle")}>
        <EditTransactionForm
          transaction={transaction}
          categories={categories}
          currency={currency}
          onSuccess={() => dialogRef.current?.close()}
        />
      </Dialog>
    </div>
  );
}
