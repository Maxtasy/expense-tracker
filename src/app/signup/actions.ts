"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn } from "@/auth";

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

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { error: t("emailTaken") };
  }

  const passwordHash = await hash(password, 10);
  await db.insert(users).values({ email, passwordHash });

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
}
