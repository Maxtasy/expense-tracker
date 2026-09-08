"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { AddTransactionForm } from "./add-transaction-form";
import { TransactionDialog } from "./transaction-dialog";

type Category = { id: string; name: string; type: "expense" | "income" };

export function AddTransactionModal({ categories, currency }: { categories: Category[]; currency: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="Add transaction"
        // Inline styles for position/size/z-index: this project's Turbopack dev server has been
        // observed to silently drop newly-added numeric Tailwind utilities (bottom-6, right-6,
        // z-20, h-14, w-14) from the compiled CSS even after a full cache wipe, even though a
        // real `next build` generates them correctly (see CLAUDE.md gotchas). Positioning this
        // button is critical enough not to depend on that.
        style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 20, height: "3.5rem", width: "3.5rem" }}
        className="flex items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg shadow-black/30 transition hover:bg-accent-hover"
      >
        <Plus size={26} />
      </button>

      <TransactionDialog dialogRef={dialogRef} title="Add transaction">
        <AddTransactionForm categories={categories} currency={currency} onSuccess={() => dialogRef.current?.close()} />
      </TransactionDialog>
    </>
  );
}
