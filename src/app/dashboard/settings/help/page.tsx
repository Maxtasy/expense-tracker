import { Heart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { OnboardingTour } from "../../onboarding-tour";
import { SettingsPageHeader, SettingsSection } from "../settings-section";
import { version } from "../../../../../package.json";

export default async function HelpSettingsPage() {
  const t = await getTranslations("settings");

  return (
    <div>
      <SettingsPageHeader title={t("groups.help.title")} />

      <SettingsSection title={t("tour.label")} description={t("tour.description")}>
        <OnboardingTour trigger />
      </SettingsSection>

      <SettingsSection title={t("support")} description={t("supportDescription")}>
        <a
          href="https://paypal.me/maxtasy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover"
        >
          <Heart size={16} />
          {t("donateButton")}
        </a>
      </SettingsSection>

      <p className="mt-4 text-center text-xs text-fg-muted">{t("webVersion", { version: `v${version}` })}</p>
      <p className="mt-1 text-center text-xs text-fg-muted">{t("webVersionNote")}</p>
    </div>
  );
}
