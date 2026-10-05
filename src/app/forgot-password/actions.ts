"use server";

import { after } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { generateToken, hashToken, PASSWORD_RESET_TOKEN_TTL_MS } from "@/lib/token";
import { getBaseUrl } from "@/lib/base-url";
import { getClientIp } from "@/lib/client-ip";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

export type ForgotPasswordState = { error?: string; success?: boolean } | undefined;

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

  // Per-IP limit against email bombing / Resend quota burn. Answered with the same success
  // response so it can't be used to probe either.
  const ip = await getClientIp();
  if (await isRateLimited("forgot_password", { ip })) {
    return { success: true };
  }
  await recordAttempt("forgot_password", { ip });

  const baseUrl = await getBaseUrl();
  // The lookup, token write and email send run after the response so timing is identical
  // whether or not the account exists.
  after(async () => {
    const [user] = await db
      .select({ id: users.id, locale: users.locale })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user) return;

    // Only the most recently requested link should work -- clear out any earlier ones.
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    const token = generateToken();
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
    });

    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail(email, resetUrl, user.locale);
    } catch (err) {
      console.error("Failed to send password reset email:", err);
    }
  });

  // Same response whether or not the account exists, so this can't be used to probe registered emails.
  return { success: true };
}
