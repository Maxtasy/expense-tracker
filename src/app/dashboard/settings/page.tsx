import { ChevronRight, Database, HelpCircle, SlidersHorizontal, User } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getVerificationStatus } from "@/lib/verification";
import { GUEST_TTL_DAYS } from "@/lib/guest";
import { UpgradeGuestForm } from "./upgrade-guest-form";
import { SettingsSection } from "./settings-section";

const GROUPS = [
  { key: "preferences", href: "/dashboard/settings/preferences", Icon: SlidersHorizontal },
  { key: "data", href: "/dashboard/settings/data", Icon: Database },
  { key: "account", href: "/dashboard/settings/account", Icon: User },
  { key: "help", href: "/dashboard/settings/help", Icon: HelpCircle },
] as const;

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;
  const [t, account] = await Promise.all([getTranslations("settings"), getVerificationStatus(session.user.id)]);
  const isGuest = account?.isGuest ?? false;

  return (
    <div>
      <h1 className="mb-3 text-sm font-semibold text-fg">{t("title")}</h1>

      {isGuest && (
        <SettingsSection id="create-account" title={t("upgradeGuest.label")} description={t("upgradeGuest.description", { days: GUEST_TTL_DAYS })}>
          <UpgradeGuestForm />
        </SettingsSection>
      )}

      <nav aria-label={t("title")} className="mb-4 divide-y divide-border rounded-xl border border-border bg-surface/30">
        {GROUPS.map(({ key, href, Icon }) => (
          <Link key={key} href={href} className="flex min-h-14 items-center gap-3 px-3 py-2.5 hover:bg-surface-hover">
            <Icon size={18} className="shrink-0 text-fg-muted" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-fg">{t(`groups.${key}.title`)}</span>
              <span className="block text-xs text-fg-muted">{t(`groups.${key}.description`)}</span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-fg-muted" aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
