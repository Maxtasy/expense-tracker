"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { hashResetToken } from "@/lib/reset-token";

export type ResetPasswordState = { error: string } | undefined;

export async function resetPassword(_prevState: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const t = await getTranslations("auth.resetPassword");

  const token = formData.get("token");
  if (typeof token !== "string" || !token) {
    return { error: t("invalidOrExpiredTitle") };
  }

  const schema = z
    .object({
      newPassword: z.string().min(8, t("passwordTooShort")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

  const parsed = schema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const tokenHash = hashResetToken(token);
  const [resetToken] = await db
    .select({ userId: passwordResetTokens.userId, expiresAt: passwordResetTokens.expiresAt })
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt)))
    .limit(1);

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return { error: t("invalidOrExpiredTitle") };
  }

  const passwordHash = await hash(parsed.data.newPassword, 10);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, resetToken.userId));
    // The token (and any sibling ones from repeat requests) is single-use -- drop it now that it's spent.
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, resetToken.userId));
  });

  redirect("/login?reset=success");
}
