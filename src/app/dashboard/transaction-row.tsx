"use client";

import { useRef } from "react";
import { Pencil, Trash2, Repeat } from "lucide-react";
import { deleteTransaction } from "./actions";
import { categoryColor } from "@/lib/category-color";
import { formatMoney } from "@/lib/currency";
import { Dialog } from "./dialog";
import { EditTransactionForm } from "./edit-transaction-form";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-1 py-2.5 last:border-b-0">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: categoryColor(transaction.categoryName) }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm text-fg">
          {transaction.description || transaction.categoryName || "Transaction"}
          {transaction.recurringTransactionId && (
            <Repeat size={11} className="shrink-0 text-fg-muted" aria-label="Recurring" />
          )}
        </p>
        <p className="text-xs text-fg-muted">
          {transaction.categoryName ?? "Uncategorized"} &middot; {transaction.date}
        </p>
      </div>
      <span className={`shrink-0 text-sm font-medium ${isIncome ? "text-success" : "text-fg"}`}>
        {isIncome ? "+" : "-"}
        {formatMoney(transaction.amount, currency)}
      </span>
      <div className="flex shrink-0 items-center gap-2 text-fg-muted">
        <button type="button" onClick={() => dialogRef.current?.showModal()} aria-label="Edit" className="rounded-lg p-1.5 hover:text-fg">
          <Pencil size={15} />
        </button>
        <form action={deleteTransaction} className="contents">
          <input type="hidden" name="id" value={transaction.id} />
          <button type="submit" aria-label="Delete" className="rounded-lg p-1.5 hover:text-danger">
            <Trash2 size={15} />
          </button>
        </form>
      </div>

      <Dialog dialogRef={dialogRef} title="Edit transaction">
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
