import { getRequestConfig } from "next-intl/server";
import { auth } from "@/auth";
import { getPreAuthLocale, getUserLocale } from "@/lib/locale-server";

// No URL-based locale routing: the active locale is a per-user Settings choice (mirrors the
// `currency` setting) once signed in. Signed-out routes (landing, login, signup) fall back to a
// cookie set by the pre-auth locale switcher, since there's no user record yet to read a
// preference from -- /privacy stays hardcoded English regardless (see its own component; it
// never calls a translation function, so this locale only affects its <html lang> attribute).
export default getRequestConfig(async () => {
  const session = await auth();
  let locale: string;
  if (session?.user) {
    locale = await getUserLocale(session.user.id);
  } else {
    locale = await getPreAuthLocale();
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
