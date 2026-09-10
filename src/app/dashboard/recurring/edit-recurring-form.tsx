"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateRecurring } from "./actions";
import { currencySymbol } from "@/lib/currency";
import { AmountInput } from "@/components/amount-input";

type TxType = "expense" | "income";
type Category = { id: string; name: string; type: TxType };
type Recurring = {
  id: string;
  type: TxType;
  amount: string;
  description: string | null;
  categoryId: string | null;
  startDate: string;
  endDate: string | null;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none";

export function EditRecurringForm({
  recurring,
  categories,
  currency,
  onSuccess,
}: {
  recurring: Recurring;
  categories: Category[];
  currency: string;
  onSuccess?: () => void;
}) {
  const t = useTranslations("recurring");
  const tDashboardForm = useTranslations("dashboard.form");
  const tCommon = useTranslations("common");
  const [type, setType] = useState<TxType>(recurring.type);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const filteredCategories = categories.filter((c) => c.type === type);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateRecurring(null, formData);
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
      <input type="hidden" name="id" value={recurring.id} />
      <div className="grid grid-cols-2 gap-2">
        <label
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition ${
            type === "expense" ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-fg-muted"
          }`}
        >
          <input type="radio" name="type" value="expense" checked={type === "expense"} onChange={() => setType("expense")} className="sr-only" />
          {tCommon("expense")}
        </label>
        <label
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition ${
            type === "income" ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-fg-muted"
          }`}
        >
          <input type="radio" name="type" value="income" checked={type === "income"} onChange={() => setType("income")} className="sr-only" />
          {tCommon("income")}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <AmountInput symbol={currencySymbol(currency)} required defaultValue={recurring.amount} />
        <select
          key={type}
          name="categoryId"
          defaultValue={recurring.type === type ? (recurring.categoryId ?? "") : ""}
          aria-label={tDashboardForm("categoryLabel")}
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
      <input name="description" type="text" aria-label={tDashboardForm("descriptionLabel")} defaultValue={recurring.description ?? ""} className={inputClass} />
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="block text-[11px] text-fg-muted">{t("startsOn")}</span>
          <input name="startDate" type="date" required defaultValue={recurring.startDate} className={inputClass} />
        </label>
        <label className="space-y-1">
          <span className="block text-[11px] text-fg-muted">{t("endsOnOptional")}</span>
          <input name="endDate" type="date" defaultValue={recurring.endDate ?? ""} className={inputClass} />
        </label>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending ? tCommon("saving") : tCommon("save")}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
