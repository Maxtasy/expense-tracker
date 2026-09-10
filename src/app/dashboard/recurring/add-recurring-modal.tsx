"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { AddRecurringForm } from "./add-recurring-form";
import { Dialog } from "../dialog";
import { AddFab } from "../add-fab";

type TxType = "expense" | "income";
type Category = { id: string; name: string; type: TxType };

export function AddRecurringModal({ categories, currency }: { categories: Category[]; currency: string }) {
  const t = useTranslations("recurring");
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <AddFab onClick={() => dialogRef.current?.showModal()} label={t("addFabLabel")} />

      <Dialog dialogRef={dialogRef} title={t("addTitle")}>
        <AddRecurringForm categories={categories} currency={currency} onSuccess={() => dialogRef.current?.close()} />
      </Dialog>
    </>
  );
}
