"use server";

import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";
import { signIn } from "@/auth";
import { getClientIp } from "@/lib/client-ip";
import { getPreAuthLocale } from "@/lib/locale-server";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";

export type GuestState = { error: string } | undefined;

export async function startGuestSession(): Promise<GuestState> {
  const t = await getTranslations("auth.guest");

  const ip = await getClientIp();
  if (await isRateLimited("guest", { ip })) {
    return { error: t("tooManyAttempts") };
  }
  await recordAttempt("guest", { ip });

  try {
    await signIn("guest", { locale: await getPreAuthLocale(), redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return { error: t("genericError") };
    throw error;
  }
}
