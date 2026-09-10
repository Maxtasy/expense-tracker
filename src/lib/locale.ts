export const LOCALES = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "pt", name: "Português" },
] as const;

export const DEFAULT_LOCALE = "en";

// Cookie used to remember a locale choice made before signing in (landing, login, signup) --
// once a user has an account, users.locale (set via Settings) takes over instead.
export const PRE_AUTH_LOCALE_COOKIE = "locale";
