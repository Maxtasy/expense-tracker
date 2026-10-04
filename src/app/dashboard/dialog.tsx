"use client";

import type { RefObject } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

export function Dialog({
  dialogRef,
  title,
  children,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  title: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("common");

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) dialogRef.current?.close();
  }

  return (
    <>
      {/* Raw CSS, not a Tailwind `backdrop:` utility: ::backdrop is a pseudo-element, so it
          can't be reached via inline style, and this dev environment has proven unreliable
          at compiling first-time-used utility classes (see CLAUDE.md gotchas). */}
      <style>{`.app-dialog::backdrop { background: oklch(0.08 0.005 255 / 0.66); backdrop-filter: blur(2px); } @keyframes dialog-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } } .app-dialog[open] { animation: dialog-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1); } @media (prefers-reduced-motion: reduce) { .app-dialog[open] { animation: none; } } @media (max-width: 640px) { .app-dialog { margin-top: 0.5rem !important; } }`}</style>
      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        style={{ position: "fixed", inset: 0, margin: "auto", width: "calc(100% - 2rem)", maxWidth: "28rem", maxHeight: "calc(100dvh - 1rem)", overflowY: "auto" }}
        className="app-dialog rounded-xl border border-border bg-surface p-4 text-fg"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          <button type="button" onClick={() => dialogRef.current?.close()} aria-label={t("close")} className="rounded-lg p-1.5 text-fg-muted hover:text-fg">
            <X size={18} />
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}
