import { Upload } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ExportLinks } from "../export-links";
import { ImportForm } from "../import-form";
import { StartFreshForm } from "../start-fresh-form";
import { SettingsPageHeader, SettingsSection } from "../settings-section";

export default async function DataSettingsPage() {
  const t = await getTranslations("settings");
  const exportLinks = [
    { href: "/dashboard/settings/export/categories", label: t("csvImport.categoriesFileLabel") },
    { href: "/dashboard/settings/export/recurring-transactions", label: t("csvImport.recurringFileLabel") },
    { href: "/dashboard/settings/export/transactions", label: t("csvImport.transactionsFileLabel") },
  ];

  return (
    <div>
      <SettingsPageHeader title={t("groups.data.title")} />

      <SettingsSection title={t("export")}>
        <ExportLinks links={exportLinks} />
      </SettingsSection>

      <SettingsSection title={t("importMoneyManagerLabel")} description={t("importMoneyManagerDescription")}>
        <Link
          href="/dashboard/settings/import-money-manager"
          className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg hover:bg-surface-hover"
        >
          {t("importMoneyManagerLink")}
          <Upload size={16} className="text-fg-muted" />
        </Link>
      </SettingsSection>

      <SettingsSection title={t("import")} description={t("importDescription")}>
        <ImportForm />
      </SettingsSection>

      <SettingsSection title={t("startFresh.label")} description={t("startFresh.description")} danger>
        <StartFreshForm />
      </SettingsSection>
    </div>
  );
}
