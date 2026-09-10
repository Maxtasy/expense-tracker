"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { AddTransactionForm } from "./add-transaction-form";
import { Dialog } from "./dialog";
import { AddFab } from "./add-fab";

type Category = { id: string; name: string; type: "expense" | "income" };

export function AddTransactionModal({ categories, currency }: { categories: Category[]; currency: string }) {
  const t = useTranslations("dashboard.form");
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <AddFab onClick={() => dialogRef.current?.showModal()} label={t("addFabLabel")} />

      <Dialog dialogRef={dialogRef} title={t("addTitle")}>
        <AddTransactionForm categories={categories} currency={currency} onSuccess={() => dialogRef.current?.close()} />
      </Dialog>
    </>
  );
}
