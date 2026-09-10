import { Download, Heart, Upload } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getUserCurrency } from "@/lib/currency-server";
import { getUserLocale } from "@/lib/locale-server";
import { ImportForm } from "./import-form";
import { CurrencyForm } from "./currency-form";
import { LocaleForm } from "./locale-form";
import { version } from "../../../../package.json";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;
  const [currency, locale, t] = await Promise.all([
    getUserCurrency(session.user.id),
    getUserLocale(session.user.id),
    getTranslations("settings"),
  ]);

  const exportLinks = [
    { href: "/dashboard/settings/export/categories", label: t("csvImport.categoriesFileLabel") },
    { href: "/dashboard/settings/export/recurring-transactions", label: t("csvImport.recurringFileLabel") },
    { href: "/dashboard/settings/export/transactions", label: t("csvImport.transactionsFileLabel") },
  ];

  return (
    <div>
      <h1 className="mb-3 text-sm font-semibold text-fg">{t("title")}</h1>

      <h2 className="mb-1.5 text-xs font-medium text-fg-muted">{t("currency")}</h2>
      <div className="mb-4 rounded-xl border border-border bg-surface/30 p-3">
        <CurrencyForm currency={currency} locale={locale} />
      </div>

      <h2 className="mb-1.5 text-xs font-medium text-fg-muted">{t("language")}</h2>
      <div className="mb-4 rounded-xl border border-border bg-surface/30 p-3">
        <LocaleForm locale={locale} />
      </div>

      <h2 className="mb-1.5 text-xs font-medium text-fg-muted">{t("export")}</h2>
      <div className="mb-4 rounded-xl border border-border bg-surface/30 p-3">
        <div className="flex flex-col gap-2">
          {exportLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              download
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg hover:bg-surface-hover"
            >
              {link.label}
              <Download size={16} className="text-fg-muted" />
            </a>
          ))}
        </div>
      </div>

      <h2 className="mb-1.5 text-xs font-medium text-fg-muted">{t("importMoneyManagerLabel")}</h2>
      <div className="mb-4 rounded-xl border border-border bg-surface/30 p-3">
        <p className="mb-3 text-xs text-fg-muted">{t("importMoneyManagerDescription")}</p>
        <Link
          href="/dashboard/settings/import-money-manager"
          className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg hover:bg-surface-hover"
        >
          {t("importMoneyManagerLink")}
          <Upload size={16} className="text-fg-muted" />
        </Link>
      </div>

      <h2 className="mb-1.5 text-xs font-medium text-fg-muted">{t("import")}</h2>
      <div className="mb-4 rounded-xl border border-border bg-surface/30 p-3">
        <p className="mb-3 text-xs text-fg-muted">{t("importDescription")}</p>
        <ImportForm />
      </div>

      <h2 className="mb-1.5 text-xs font-medium text-fg-muted">{t("support")}</h2>
      <div className="rounded-xl border border-border bg-surface/30 p-3">
        <p className="mb-3 text-xs text-fg-muted">{t("supportDescription")}</p>
        <a
          href="https://paypal.me/maxtasy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover"
        >
          <Heart size={16} />
          {t("donateButton")}
        </a>
      </div>

      <p className="mt-4 text-center text-xs text-fg-muted">v{version}</p>
    </div>
  );
}
