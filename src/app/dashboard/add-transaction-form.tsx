"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createTransaction } from "./actions";
import { currencySymbol } from "@/lib/currency";
import { AmountInput } from "@/components/amount-input";
import { typeButtonClass, typeChipClass } from "@/lib/type-theme";

type Category = { id: string; name: string; type: "expense" | "income" };
type TxType = "expense" | "income";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none";

export function AddTransactionForm({
  categories,
  currency,
  onSuccess,
}: {
  categories: Category[];
  currency: string;
  onSuccess?: () => void;
}) {
  const t = useTranslations("dashboard.form");
  const tCommon = useTranslations("common");
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<TxType>("expense");
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const filteredCategories = categories.filter((c) => c.type === type);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTransaction(undefined, formData);
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
        <select key={type} name="categoryId" defaultValue="" aria-label={t("categoryLabel")} className={inputClass}>
          <option value="">{tCommon("uncategorized")}</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input name="date" type="date" required aria-label={t("dateLabel")} defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        <input name="description" type="text" placeholder={t("descriptionPlaceholder")} className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${typeButtonClass(type)}`}
      >
        {isPending ? tCommon("adding") : tCommon("add")}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
