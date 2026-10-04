"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteAccount } from "./actions";
import { Dialog } from "../dialog";
import { Spinner } from "@/components/spinner";

export function DeleteAccountForm({ isGuest }: { isGuest: boolean }) {
  const t = useTranslations("settings.deleteAccount");
  const tCommon = useTranslations("common");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [typedConfirm, setTypedConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const canSubmit = confirmed && typedConfirm.trim().toUpperCase() === "DELETE" && (isGuest || password.length > 0);

  function openModal() {
    setError(undefined);
    setConfirmed(false);
    setTypedConfirm("");
    setPassword("");
    dialogRef.current?.showModal();
  }

  // On success the action signs the user out and redirects to /login, so only the error path
  // needs handling here.
  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await deleteAccount(formData);
      if (result?.error) setError(result.error);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none";

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full rounded-lg bg-danger px-3 py-2 text-sm font-medium text-accent-fg transition"
      >
        {t("openButton")}
      </button>

      <Dialog dialogRef={dialogRef} title={t("modalTitle")}>
        <form action={handleSubmit} className="space-y-3">
          <p className="text-sm text-fg-muted">{t("modalWarning")}</p>
          <label className="flex items-start gap-2 text-xs text-fg-muted">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
            {t("confirmCheckbox")}
          </label>
          <div className="space-y-1">
            <label htmlFor="deleteAccountConfirmInput" className="block text-xs text-fg-muted">
              {t("typeToConfirmLabel")}
            </label>
            <input
              id="deleteAccountConfirmInput"
              type="text"
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className={inputClass}
            />
          </div>
          {!isGuest && (
            <div className="space-y-1">
              <label htmlFor="deleteAccountPassword" className="block text-xs text-fg-muted">
                {t("passwordLabel")}
              </label>
              <input
                id="deleteAccountPassword"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className={inputClass}
              />
            </div>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-fg-muted hover:text-fg"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isPending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger px-3 py-2 text-sm font-medium text-accent-fg transition disabled:opacity-40"
            >
              {isPending && <Spinner size={14} />}
              {isPending ? t("deleting") : t("confirmButton")}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
