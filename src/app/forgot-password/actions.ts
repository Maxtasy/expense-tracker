"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { generateResetToken, hashResetToken, PASSWORD_RESET_TOKEN_TTL_MS } from "@/lib/reset-token";
import { sendPasswordResetEmail } from "@/lib/email";

export type ForgotPasswordState = { error?: string; success?: boolean } | undefined;

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const t = await getTranslations("auth.signup");

  const schema = z.object({ email: z.string().trim().email(t("invalidEmail")) });
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { email } = parsed.data;

  const [user] = await db
    .select({ id: users.id, locale: users.locale })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user) {
    // Only the most recently requested link should work -- clear out any earlier ones.
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    const token = generateResetToken();
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
    });

    const baseUrl = await getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(email, resetUrl, user.locale);
    } catch (err) {
      console.error("Failed to send password reset email:", err);
    }
  }

  // Same response whether or not the account exists, so this can't be used to probe registered emails.
  return { success: true };
}
