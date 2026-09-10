"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createCategory } from "./actions";
import { typeButtonClass, typeChipClass } from "@/lib/type-theme";
import { Spinner } from "@/components/spinner";

type TxType = "expense" | "income";

export function AddCategoryForm({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<TxType>("expense");
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createCategory(null, formData);
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
      <div className="flex items-center gap-2">
        <input
          name="name"
          type="text"
          placeholder={t("namePlaceholder")}
          required
          maxLength={50}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${typeButtonClass(type)}`}
        >
          {isPending && <Spinner size={14} />}
          {isPending ? tCommon("adding") : tCommon("add")}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-center text-xs font-medium transition ${typeChipClass("expense", type === "expense")}`}
        >
          <input type="radio" name="type" value="expense" checked={type === "expense"} onChange={() => setType("expense")} className="sr-only" />
          {tCommon("expense")}
        </label>
        <label
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-center text-xs font-medium transition ${typeChipClass("income", type === "income")}`}
        >
          <input type="radio" name="type" value="income" checked={type === "income"} onChange={() => setType("income")} className="sr-only" />
          {tCommon("income")}
        </label>
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </form>
  );
}
