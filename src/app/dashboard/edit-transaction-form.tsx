"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateTransaction } from "./actions";
import { currencySymbol } from "@/lib/currency";
import { AmountInput } from "@/components/amount-input";
import { typeButtonClass, typeChipClass } from "@/lib/type-theme";
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
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none";

export function EditTransactionForm({
  transaction,
  categories,
  currency,
  onSuccess,
}: {
  transaction: Transaction;
  categories: Category[];
  currency: string;
  onSuccess?: () => void;
}) {
  const t = useTranslations("dashboard.form");
  const tCommon = useTranslations("common");
  const [type, setType] = useState<TxType>(transaction.type);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const filteredCategories = categories.filter((c) => c.type === type);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateTransaction(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        onSuccess?.();
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-2">
      <input type="hidden" name="id" value={transaction.id} />
      <div className="grid grid-cols-2 gap-2">
        <label
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition ${typeChipClass("expense", type === "expense")}`}
        >
          <input type="radio" name="type" value="expense" checked={type === "expense"} onChange={() => setType("expense")} className="sr-only" />
          {tCommon("expense")}
        </label>
        <label
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition ${typeChipClass("income", type === "income")}`}
        >
          <input type="radio" name="type" value="income" checked={type === "income"} onChange={() => setType("income")} className="sr-only" />
          {tCommon("income")}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <AmountInput symbol={currencySymbol(currency)} required defaultValue={transaction.amount} />
        <select
          key={type}
          name="categoryId"
          defaultValue={transaction.type === type ? (transaction.categoryId ?? "") : ""}
          aria-label={t("categoryLabel")}
          className={inputClass}
        >
          <option value="">{tCommon("uncategorized")}</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input name="date" type="date" required aria-label={t("dateLabel")} defaultValue={transaction.date} className={inputClass} />
        <input name="description" type="text" aria-label={t("descriptionLabel")} defaultValue={transaction.description ?? ""} className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${typeButtonClass(type)}`}
      >
        {isPending && <Spinner size={14} />}
        {isPending ? tCommon("saving") : tCommon("save")}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
