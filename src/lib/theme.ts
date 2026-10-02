export const THEMES = ["dark", "light", "system"] as const;
export type Theme = (typeof THEMES)[number];

// dark stays the default so existing users see no change until they opt in; signed-out pages
// (landing, login, signup, privacy) have no user record to read from and stay dark too.
export const DEFAULT_THEME: Theme = "dark";

export const THEME_COLOR: Record<"dark" | "light", string> = {
  dark: "#07080b",
  light: "#f5f7f9",
};
