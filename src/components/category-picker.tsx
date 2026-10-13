"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { createCategory } from "@/app/dashboard/categories/actions";
import { Dialog } from "@/app/dashboard/dialog";
import { Spinner } from "@/components/spinner";

type Option = { id: string; name: string };

// Replaces the category <select>: a button showing the current category that opens a top-aligned,
// scrollable dialog with every category as a chip (two columns) plus a quick "New category" entry.
// The chosen id is submitted under `name` through a hidden input, so the surrounding forms and
// Server Actions are unchanged. Callers pass the already type-filtered list and re-key on type.
export function CategoryPicker({
  categories,
  type,
  defaultValue = "",
  name = "categoryId",
  ariaLabel,
  className = "",
}: {
  categories: Option[];
  type: "expense" | "income";
  defaultValue?: string;
  name?: string;
  ariaLabel: string;
  className?: string;
}) {
  const t = useTranslations("dashboard.form");
  const tCategories = useTranslations("categories");
  const tCommon = useTranslations("common");
  const hiddenRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [selectedId, setSelectedId] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | undefined>();
  // categories created here, kept until the refreshed server props include them
  const [created, setCreated] = useState<Option[]>([]);
  const [isPending, startTransition] = useTransition();

  const options: Option[] = [
    { id: "", name: tCommon("uncategorized") },
    ...categories,
    ...created.filter((c) => !categories.some((k) => k.id === c.id)),
  ];
  const selected = options.find((o) => o.id === selectedId) ?? options[0];

  // the forms call form.reset() after a successful add; React state wouldn't follow that on its own
  useEffect(() => {
    const form = hiddenRef.current?.form;
    if (!form) return;
    const onReset = () => setSelectedId(defaultValue);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [defaultValue]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    const onClose = () => {
      setOpen(false);
      setCreating(false);
      setNewName("");
      setError(undefined);
    };
    dialog?.addEventListener("close", onClose);
    return () => dialog?.removeEventListener("close", onClose);
  }, [open]);

  function choose(id: string) {
    setSelectedId(id);
    dialogRef.current?.close();
  }

  function handleCreate() {
    const formData = new FormData();
    formData.set("name", newName);
    formData.set("type", type);
    startTransition(async () => {
      const result = await createCategory(null, formData);
      if (result?.error || !result?.id) {
        setError(result?.error);
        return;
      }
      setCreated((prev) => [...prev, { id: result.id!, name: newName.trim() }]);
      choose(result.id);
    });
  }

  const chipClass = (active: boolean) =>
    `min-h-11 w-full truncate rounded-lg border px-3 py-2 text-left text-sm transition ${
      active ? "border-accent bg-surface-hover font-medium text-fg" : "border-border bg-surface text-fg-muted hover:text-fg"
    }`;

  return (
    <>
      <input type="hidden" ref={hiddenRef} name={name} value={selectedId} />
      <button
        type="button"
        aria-label={`${ariaLabel}: ${selected.name}`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={`${className} flex items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">{selected.name}</span>
        <ChevronDown size={14} className="shrink-0 text-fg-muted" aria-hidden />
      </button>
      {/* portal: keeps the picker's own input and buttons out of the surrounding <form> */}
      {open &&
        createPortal(
          <Dialog dialogRef={dialogRef} title={t("categoryPickerTitle")} placement="top">
            <div // while the name field is showing, keep the list short so the field and Add button stay in the
            // top half of the screen, above an on-screen keyboard (which doesn't shrink dvh units)
            style={{ maxHeight: creating ? "35dvh" : "calc(100dvh - 11rem)", overflowY: "auto" }} className="-mx-1 px-1">
              <div className="grid grid-cols-2 gap-2">
                {options.map((o) => (
                  <button key={o.id || "none"} type="button" aria-pressed={o.id === selectedId} onClick={() => choose(o.id)} className={chipClass(o.id === selectedId)}>
                    {o.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 border-t border-border pt-3">
              {creating ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoComplete="off"
                      autoFocus
                      maxLength={50}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newName.trim() && !isPending) handleCreate();
                        }
                      }}
                      aria-label={tCategories("categoryName")}
                      placeholder={tCategories("namePlaceholder")}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={isPending || !newName.trim()}
                      onClick={handleCreate}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-60"
                    >
                      {isPending && <Spinner size={14} />}
                      {isPending ? tCommon("adding") : tCommon("add")}
                    </button>
                  </div>
                  {error && <p role="alert" className="text-sm text-danger">{error}</p>}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-fg transition hover:bg-surface-hover"
                >
                  <Plus size={14} />
                  {t("newCategory")}
                </button>
              )}
            </div>
          </Dialog>,
          document.body,
        )}
    </>
  );
}
