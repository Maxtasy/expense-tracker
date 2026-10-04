import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function GuestBanner({ daysLeft }: { daysLeft: number }) {
  const t = await getTranslations("dashboard.guestBanner");

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-muted">
      <span>{t("message", { days: daysLeft })}</span>
      <Link href="/dashboard/settings#create-account" className="text-accent-text hover:text-accent-hover">
        {t("createAccount")}
      </Link>
    </div>
  );
}
