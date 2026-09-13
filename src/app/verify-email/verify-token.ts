import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { hashToken } from "@/lib/token";

// Called directly from the /verify-email page's server component render, not a form submission --
// kept out of actions.ts (which has a top-level "use server") so importing it never pulls
// server-only DB code into a client bundle.
export async function consumeVerificationToken(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  const [row] = await db
    .select({ userId: emailVerificationTokens.userId, expiresAt: emailVerificationTokens.expiresAt })
    .from(emailVerificationTokens)
    .where(and(eq(emailVerificationTokens.tokenHash, tokenHash), isNull(emailVerificationTokens.usedAt)))
    .limit(1);

  if (!row || row.expiresAt < new Date()) {
    return false;
  }

  await db.transaction(async (tx) => {
    await tx.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, row.userId));
    // Single-use: the token (and any sibling from a repeat request) is spent now.
    await tx.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, row.userId));
  });

  return true;
}
