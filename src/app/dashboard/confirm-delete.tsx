"use client";

import { useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/spinner";
import type { ActionResult } from "@/lib/action-result";
import { Dialog } from "./dialog";

// Trash button that asks before running a delete Server Action (taking an `id` form field).
export function ConfirmDelete({
  action,
  id,
  title,
  message,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  id: string;
  title: string;
  message: string;
}) {
  const tCommon = useTranslations("common");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleDelete(formData: FormData) {
    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      dialogRef.current?.close();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(undefined);
          dialogRef.current?.showModal();
        }}
        aria-label={tCommon("delete")}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:text-danger"
      >
        <Trash2 size={15} />
      </button>
      <Dialog dialogRef={dialogRef} title={title}>
        <form action={handleDelete} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <p className="text-sm text-fg-muted">{message}</p>
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-accent-fg hover:bg-danger-hover disabled:opacity-60"
            >
              {isPending && <Spinner size={12} />}
              {tCommon("delete")}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-fg-muted hover:text-fg disabled:opacity-60"
            >
              {tCommon("cancel")}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
