"use client";

import { useRef } from "react";
import { AddRecurringForm } from "./add-recurring-form";
import { Dialog } from "../dialog";
import { AddFab } from "../add-fab";

type TxType = "expense" | "income";
type Category = { id: string; name: string; type: TxType };

export function AddRecurringModal({ categories, currency }: { categories: Category[]; currency: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <AddFab onClick={() => dialogRef.current?.showModal()} label="Add recurring transaction" />

      <Dialog dialogRef={dialogRef} title="Add recurring transaction">
        <AddRecurringForm categories={categories} currency={currency} onSuccess={() => dialogRef.current?.close()} />
      </Dialog>
    </>
  );
}
