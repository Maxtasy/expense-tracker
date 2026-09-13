"use server";

import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";
import { signIn } from "@/auth";
import { getClientIp } from "@/lib/client-ip";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";

export type LoginState = { error: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const t = await getTranslations("auth.login");
  const email = formData.get("email");
  const ip = await getClientIp();

  if (typeof email === "string" && (await isRateLimited("login", { email, ip }))) {
    return { error: t("tooManyAttempts") };
  }

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          await recordAttempt("login", { email: typeof email === "string" ? email : undefined, ip });
          return { error: t("invalidCredentials") };
        default:
          return { error: t("genericError") };
      }
    }
    throw error;
  }
}
