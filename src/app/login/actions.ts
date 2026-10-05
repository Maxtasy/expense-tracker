"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { getTranslations } from "next-intl/server";
import { signIn } from "@/auth";

export type LoginState = { error: string; needsVerification?: boolean; email?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const t = await getTranslations("auth.login");
  const email = formData.get("email");
  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // Blocked-for-verification is a distinct case from a bad password guess -- don't count it
    // against the rate limit, and show a message with a resend affordance instead.
    if (error instanceof CredentialsSignin && error.code === "email_not_verified") {
      return { error: t("emailNotVerified"), needsVerification: true, email: typeof email === "string" ? email.trim().toLowerCase() : undefined };
    }
    if (error instanceof CredentialsSignin && error.code === "too_many_attempts") {
      return { error: t("tooManyAttempts") };
    }
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: t("invalidCredentials") };
        default:
          return { error: t("genericError") };
      }
    }
    throw error;
  }
}
