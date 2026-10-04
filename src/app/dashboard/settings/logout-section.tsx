"use client";

import { useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { logout } from "../actions";
import { Dialog } from "../dialog";
import { Spinner } from "@/components/spinner";

// For guests, logging out can't be undone (no email/password to log back in with), so it goes
// through a dialog that repeats the warning and offers creating an account instead.
export function LogoutSection({ isGuest }: { isGuest: boolean }) {
  const t = useTranslations("settings.logout");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  function handleCreateAccount() {
    dialogRef.current?.close();
    document.getElementById("create-account")?.scrollIntoView({ behavior: "smooth" });
  }

  const buttonClass =
    "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-fg transition hover:bg-surface-hover disabled:opacity-60";

  return (
    <>
      {isGuest ? (
        <button type="button" onClick={() => dialogRef.current?.showModal()} className={buttonClass}>
          <LogOut size={14} />
          {t("button")}
        </button>
      ) : (
        <form action={handleLogout}>
          <button type="submit" disabled={isPending} className={buttonClass}>
            {isPending ? <Spinner size={14} /> : <LogOut size={14} />}
            {t("button")}
          </button>
        </form>
      )}

      {isGuest && (
        <Dialog dialogRef={dialogRef} title={t("guestTitle")}>
          <p className="mb-3 text-sm text-fg-muted">{t("guestWarning")}</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleCreateAccount}
              className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover"
            >
              {t("guestCreateAccount")}
            </button>
            <form action={handleLogout}>
              <button type="submit" disabled={isPending} className={`${buttonClass} text-danger`}>
                {isPending && <Spinner size={14} />}
                {t("guestConfirm")}
              </button>
            </form>
          </div>
        </Dialog>
      )}
    </>
  );
}
