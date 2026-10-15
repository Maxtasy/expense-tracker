import { getUserSettingsRow } from "@/lib/user-settings-server";
import { DEFAULT_DATE_FORMAT } from "@/lib/date-format";
import { DEFAULT_THEME, THEMES, type Theme } from "@/lib/theme";

export async function getUserDateFormat(userId: string): Promise<string> {
  const row = await getUserSettingsRow(userId);
  return row?.dateFormat ?? DEFAULT_DATE_FORMAT;
}

export async function getUserRememberLastCategory(userId: string): Promise<boolean> {
  const row = await getUserSettingsRow(userId);
  return row?.rememberLastCategory ?? false;
}

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const row = await getUserSettingsRow(userId);
  return row?.onboardedAt != null;
}

export async function getUserTheme(userId: string): Promise<Theme> {
  const row = await getUserSettingsRow(userId);
  return THEMES.find((t) => t === row?.theme) ?? DEFAULT_THEME;
}
