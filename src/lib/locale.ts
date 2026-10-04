export const LOCALES = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "pt", name: "Português" },
] as const;

export const DEFAULT_LOCALE = "en";

// Picks the first supported language from an Accept-Language header ("pt-BR,pt;q=0.9,en;q=0.8"
// -> "pt"), so a first-time visitor gets their phone's language instead of always English.
export function matchAcceptLanguage(header: string | null | undefined): string {
  for (const part of (header ?? "").split(",")) {
    const base = part.split(";")[0].trim().toLowerCase().split("-")[0];
    if (LOCALES.some((l) => l.code === base)) return base;
  }
  return DEFAULT_LOCALE;
}

// Cookie used to remember a locale choice made before signing in (landing, login, signup) --
// once a user has an account, users.locale (set via Settings) takes over instead.
export const PRE_AUTH_LOCALE_COOKIE = "locale";
