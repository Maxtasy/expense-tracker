"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createRecurring } from "./actions";
import { currencySymbol } from "@/lib/currency";
import { AmountInput } from "@/components/amount-input";
import { typeButtonClass, typeChipClass } from "@/lib/type-theme";
import { Spinner } from "@/components/spinner";

type TxType = "expense" | "income";
type Category = { id: string; name: string; type: TxType };

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none";

export function AddRecurringForm({
  categories,
  currency,
  onSuccess,
}: {
  categories: Category[];
  currency: string;
  onSuccess?: () => void;
}) {
  const t = useTranslations("recurring");
  const tDashboardForm = useTranslations("dashboard.form");
  const tCommon = useTranslations("common");
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<TxType>("expense");
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const filteredCategories = categories.filter((c) => c.type === type);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createRecurring(null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        formRef.current?.reset();
        setType("expense");
        onSuccess?.();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2">
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
        <AmountInput symbol={currencySymbol(currency)} required />
        <select key={type} name="categoryId" defaultValue="" aria-label={tDashboardForm("categoryLabel")} className={inputClass}>
          <option value="">{tCommon("uncategorized")}</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <input name="description" type="text" placeholder={tDashboardForm("descriptionPlaceholder")} className={inputClass} />
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="block text-[11px] text-fg-muted">{t("startsOn")}</span>
          <input name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </label>
        <label className="space-y-1">
          <span className="block text-[11px] text-fg-muted">{t("endsOnOptional")}</span>
          <input name="endDate" type="date" className={inputClass} />
        </label>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${typeButtonClass(type)}`}
      >
        {isPending && <Spinner size={14} />}
        {isPending ? tCommon("adding") : t("addButton")}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
