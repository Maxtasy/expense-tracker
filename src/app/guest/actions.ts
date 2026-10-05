"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { getTranslations } from "next-intl/server";
import { signIn } from "@/auth";
import { getPreAuthLocale } from "@/lib/locale-server";

export type GuestState = { error: string } | undefined;

export async function startGuestSession(): Promise<GuestState> {
  const t = await getTranslations("auth.guest");

  try {
    await signIn("guest", { locale: await getPreAuthLocale(), redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof CredentialsSignin && error.code === "too_many_attempts") {
      return { error: t("tooManyAttempts") };
    }
    if (error instanceof AuthError) return { error: t("genericError") };
    throw error;
  }
}
