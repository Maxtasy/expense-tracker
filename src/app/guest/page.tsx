import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthBrand } from "@/components/auth-brand";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { GUEST_TTL_DAYS } from "@/lib/guest";
import { GuestStartForm } from "./guest-start-form";

const POINTS = ["full", "expiry", "device", "logout", "keep"] as const;

export default async function GuestPage() {
  const t = await getTranslations("auth.guest");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <LocaleSwitcher className="absolute right-4 top-4" />
      <div className="w-full max-w-sm">
        <AuthBrand />
        <h1 className="mb-2 text-lg font-semibold text-fg">{t("title")}</h1>
        <p className="mb-4 text-sm text-fg-muted">{t("intro")}</p>
        <ul className="mb-4 space-y-3">
          {POINTS.map((key) => (
            <li key={key} className="rounded-xl border border-border bg-surface/30 p-3">
              <h2 className="mb-0.5 text-sm font-medium text-fg">{t(`points.${key}.title`, { days: GUEST_TTL_DAYS })}</h2>
              <p className="text-xs text-fg-muted">{t(`points.${key}.body`, { days: GUEST_TTL_DAYS })}</p>
            </li>
          ))}
        </ul>
        <p className="mb-4 text-xs text-fg-muted">
          {t("privacyNote")}{" "}
          <Link href="/privacy" className="text-accent-text hover:text-accent-hover">
            {t("privacyLink")}
          </Link>
        </p>
        <GuestStartForm />
        <p className="mt-4 text-sm text-fg-muted">
          <Link href="/signup" className="text-accent-text hover:text-accent-hover">
            {t("createAccountInstead")}
          </Link>
        </p>
      </div>
    </main>
  );
}
