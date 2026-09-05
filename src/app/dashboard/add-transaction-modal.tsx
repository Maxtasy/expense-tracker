"use client";

import { useRef } from "react";
import { Plus, X } from "lucide-react";
import { AddTransactionForm } from "./add-transaction-form";

type Category = { id: string; name: string; type: "expense" | "income" };

export function AddTransactionModal({ categories, currency }: { categories: Category[]; currency: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) dialogRef.current?.close();
  }

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

      {/* Raw CSS, not a Tailwind `backdrop:` utility: ::backdrop is a pseudo-element, so it
          can't be reached via inline style, and this dev environment has proven unreliable
          at compiling first-time-used utility classes (see comment on the button above). */}
      <style>{`.add-transaction-dialog::backdrop { background: rgba(0, 0, 0, 0.6); }`}</style>
      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        style={{ position: "fixed", inset: 0, margin: "auto", width: "calc(100% - 2rem)", maxWidth: "28rem" }}
        className="add-transaction-dialog rounded-xl border border-border bg-surface p-4 text-fg"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">Add transaction</h2>
          <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close" className="text-fg-muted hover:text-fg">
            <X size={18} />
          </button>
        </div>
        <AddTransactionForm categories={categories} currency={currency} onSuccess={() => dialogRef.current?.close()} />
      </dialog>
    </>
  );
}
