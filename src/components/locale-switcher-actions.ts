"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALES, PRE_AUTH_LOCALE_COOKIE } from "@/lib/locale";

export async function setPreAuthLocale(formData: FormData) {
  const locale = formData.get("locale");
  if (typeof locale !== "string" || !LOCALES.some((l) => l.code === locale)) return;

  (await cookies()).set(PRE_AUTH_LOCALE_COOKIE, locale, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/", "layout");
}
