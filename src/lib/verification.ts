import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { generateToken, hashToken, EMAIL_VERIFICATION_TOKEN_TTL_MS } from "@/lib/token";
import { getBaseUrl } from "@/lib/base-url";
import { sendVerificationEmail } from "@/lib/email";

// Full access continues immediately after signup; login is only blocked once BOTH the account is
// unverified AND this much time has passed -- see authorize() in src/auth.ts (blocks a *new*
// login) and the dashboard layout (backstop for a session that predates the deadline).
export const EMAIL_VERIFICATION_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isVerificationGracePeriodExpired(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() > EMAIL_VERIFICATION_GRACE_PERIOD_MS;
}

export async function getVerificationStatus(userId: string) {
  const [row] = await db
    .select({ email: users.email, emailVerifiedAt: users.emailVerifiedAt, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row;
}

// Shared by signup, the dashboard banner's resend button, and the blocked-login resend flow.
export async function issueAndSendVerificationEmail(userId: string, email: string, locale: string) {
  // Only the most recently requested link should work -- clear out any earlier ones.
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));

  const token = generateToken();
  await db.insert(emailVerificationTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
  });

  const baseUrl = await getBaseUrl();
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  await sendVerificationEmail(email, verifyUrl, locale);
}
