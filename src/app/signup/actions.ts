"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn } from "@/auth";
import { getClientIp } from "@/lib/client-ip";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";
import { issueAndSendVerificationEmail } from "@/lib/verification";
import { getPreAuthLocale } from "@/lib/locale-server";

export type SignupState = { error: string } | undefined;

export async function signup(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const t = await getTranslations("auth.signup");

  const signupSchema = z.object({
    email: z.string().trim().email(t("invalidEmail")),
    password: z.string().min(8, t("passwordTooShort")),
  });

  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, password } = parsed.data;

  const ip = await getClientIp();
  if (await isRateLimited("signup", { ip })) {
    return { error: t("tooManyAttempts") };
  }
  await recordAttempt("signup", { email, ip });

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { error: t("emailTaken") };
  }

  const passwordHash = await hash(password, 10);
  const [user] = await db.insert(users).values({ email, passwordHash }).returning({ id: users.id });

  try {
    await issueAndSendVerificationEmail(user.id, email, await getPreAuthLocale());
  } catch (err) {
    // Best-effort, same as the password-reset flow -- a Resend hiccup should never block signup.
    console.error("Failed to send verification email:", err);
  }

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
}
