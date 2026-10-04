"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logout } from "./actions";
import { Spinner } from "@/components/spinner";

// confirmMessage is set for guest accounts: logging out of one can't be undone, since there's no
// email/password to log back in with.
export function LogoutButton({ label, confirmMessage }: { label: string; confirmMessage?: string }) {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <form action={handleLogout} className="contents">
      <button type="submit" disabled={isPending} aria-label={label} className="rounded-lg p-1.5 hover:text-fg disabled:opacity-60">
        {isPending ? <Spinner size={18} /> : <LogOut size={18} />}
      </button>
    </form>
  );
}
