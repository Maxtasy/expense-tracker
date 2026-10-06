"use client";

import { useRef, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/spinner";
import { Dialog } from "./dialog";

// Trash button that asks before running a delete Server Action (taking an `id` form field).
export function ConfirmDelete({
  action,
  id,
  title,
  message,
}: {
  action: (formData: FormData) => Promise<unknown>;
  id: string;
  title: string;
  message: string;
}) {
  const tCommon = useTranslations("common");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      dialogRef.current?.close();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={tCommon("delete")}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:text-danger"
      >
        <Trash2 size={15} />
      </button>
      <Dialog dialogRef={dialogRef} title={title}>
        <form action={handleDelete} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <p className="text-sm text-fg-muted">{message}</p>
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
