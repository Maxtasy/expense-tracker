"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getClientIp } from "@/lib/client-ip";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";
import { issueAndSendVerificationEmail } from "@/lib/verification";

// Shared by the /verify-email page's "request a new link" form, the login form's post-block
// resend button, and the dashboard's blocked/banner resend buttons. Always resolves the same way
// regardless of whether the email exists or is already verified, so it can't be used to probe
// registered emails -- same stance as /forgot-password.
export async function resendVerificationEmail(email: string): Promise<void> {
  const ip = await getClientIp();
  if (await isRateLimited("resend_verification", { ip })) {
    return;
  }
  await recordAttempt("resend_verification", { ip });

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
}
