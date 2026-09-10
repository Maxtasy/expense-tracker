import { getRequestConfig } from "next-intl/server";
import { auth } from "@/auth";
import { getUserLocale } from "@/lib/locale-server";
import { DEFAULT_LOCALE } from "@/lib/locale";

// No URL-based locale routing: the active locale is a per-user Settings choice (mirrors the
// `currency` setting), not part of the URL. Signed-out routes (landing, login, signup, privacy)
// always render in English since there's no user record yet to read a preference from.
export default getRequestConfig(async () => {
  const session = await auth();
  const locale = session?.user ? await getUserLocale(session.user.id) : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
