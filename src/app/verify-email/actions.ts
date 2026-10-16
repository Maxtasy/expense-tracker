"use server";

import { after } from "next/server";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getClientIp } from "@/lib/client-ip";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/email-address";
import { consumeVerificationToken } from "./verify-token";
import { issueAndSendVerificationEmail } from "@/lib/verification";
import type { ActionResult } from "@/lib/action-result";

// Shared by the /verify-email page's "request a new link" form, the login form's post-block
// resend button, and the dashboard's blocked/banner resend buttons. Always resolves the same way
// regardless of whether the email exists or is already verified, so it can't be used to probe
// registered emails -- same stance as /forgot-password.
export async function resendVerificationEmail(rawEmail: string): Promise<ActionResult> {
  const email = normalizeEmail(rawEmail);
  const ip = await getClientIp();
  if (await isRateLimited("resend_verification", { ip })) {
    return { success: true };
  }
  await recordAttempt("resend_verification", { ip });

  // Lookup and send happen after the response so timing doesn't reveal whether the account exists.
  after(async () => {
    const [user] = await db
      .select({ id: users.id, locale: users.locale, emailVerifiedAt: users.emailVerifiedAt })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user && !user.emailVerifiedAt) {
      try {
        await issueAndSendVerificationEmail(user.id, email, user.locale);
      } catch (err) {
        console.error("Failed to resend verification email:", err);
      }
    }
  });
  return { success: true };
}

// The confirm button on /verify-email: spends the token (a POST, so link scanners can't trigger it).
export async function confirmVerification(token: string): Promise<ActionResult> {
  if (await consumeVerificationToken(token)) return { success: true };
  const t = await getTranslations("auth.verifyEmail");
  return { error: t("invalidOrExpiredTitle") };
}
