import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getUserCurrency } from "@/lib/currency-server";
import { getUserLocale } from "@/lib/locale-server";
import { getUserDateFormat, getUserRememberLastCategory, getUserSwipeNavigation, getUserTheme } from "@/lib/preferences-server";
import { DATE_FORMATS, getDatePattern } from "@/lib/date-format";
import { THEMES } from "@/lib/theme";
import { CurrencyForm } from "../currency-form";
import { LocaleForm } from "../locale-form";
import { SelectSettingForm } from "../select-setting-form";
import { ToggleSettingForm } from "../toggle-setting-form";
import { SettingsPageHeader, SettingsRow, SettingsRows } from "../settings-section";
import { updateDateFormat, updateRememberLastCategory, updateSwipeNavigation, updateTheme } from "../actions";

export default async function PreferencesPage() {
  const session = await auth();
  if (!session?.user) return null;
  const [currency, locale, dateFormat, theme, rememberLastCategory, swipeNavigation, t] = await Promise.all([
    getUserCurrency(session.user.id),
    getUserLocale(session.user.id),
    getUserDateFormat(session.user.id),
    getUserTheme(session.user.id),
    getUserRememberLastCategory(session.user.id),
    getUserSwipeNavigation(session.user.id),
    getTranslations("settings"),
  ]);
  const autoDateLabel = t("dateFormat.auto", {
    language: new Intl.DisplayNames(locale, { type: "language" }).of(locale) ?? locale,
    pattern: getDatePattern("auto", locale),
  });

  return (
    <div>
      <SettingsPageHeader title={t("groups.preferences.title")} />
      <SettingsRows>
        <SettingsRow label={t("currency")}>
          <CurrencyForm currency={currency} locale={locale} />
        </SettingsRow>
        <SettingsRow label={t("language")}>
          <LocaleForm locale={locale} />
        </SettingsRow>
        <SettingsRow label={t("theme.label")}>
          <SelectSettingForm
            action={updateTheme}
            name="theme"
            value={theme}
            ariaLabel={t("theme.ariaLabel")}
            options={THEMES.map((code) => ({ value: code, label: t(`theme.options.${code}`) }))}
          />
        </SettingsRow>
        <SettingsRow label={t("dateFormat.label")}>
          <SelectSettingForm
            action={updateDateFormat}
            name="dateFormat"
            value={dateFormat}
            ariaLabel={t("dateFormat.ariaLabel")}
            options={DATE_FORMATS.map((f) => ({ value: f.code, label: f.pattern ?? autoDateLabel }))}
          />
        </SettingsRow>
        <SettingsRow label={t("rememberCategory.label")} description={t("rememberCategory.description")}>
          <ToggleSettingForm
            action={updateRememberLastCategory}
            name="rememberLastCategory"
            checked={rememberLastCategory}
            ariaLabel={t("rememberCategory.ariaLabel")}
          />
        </SettingsRow>
        <SettingsRow label={t("swipeNavigation.label")} description={t("swipeNavigation.description")}>
          <ToggleSettingForm
            action={updateSwipeNavigation}
            name="swipeNavigation"
            checked={swipeNavigation}
            ariaLabel={t("swipeNavigation.ariaLabel")}
          />
        </SettingsRow>
      </SettingsRows>
    </div>
  );
}
