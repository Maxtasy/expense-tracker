"use client";

import { useRef } from "react";
import { AddTransactionForm } from "./add-transaction-form";
import { Dialog } from "./dialog";
import { AddFab } from "./add-fab";

type Category = { id: string; name: string; type: "expense" | "income" };

export function AddTransactionModal({ categories, currency }: { categories: Category[]; currency: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <AddFab onClick={() => dialogRef.current?.showModal()} label="Add transaction" />

      <Dialog dialogRef={dialogRef} title="Add transaction">
        <AddTransactionForm categories={categories} currency={currency} onSuccess={() => dialogRef.current?.close()} />
      </Dialog>
    </>
  );
}
