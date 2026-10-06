import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { hashToken } from "@/lib/token";

// Read-only check used when /verify-email renders: opening the link (a GET, which mail scanners and
// prefetchers also do) must not spend the token -- that only happens when the person confirms.
export async function isVerificationTokenValid(token: string): Promise<boolean> {
  const [row] = await db
    .select({ expiresAt: emailVerificationTokens.expiresAt })
    .from(emailVerificationTokens)
    .where(and(eq(emailVerificationTokens.tokenHash, hashToken(token)), isNull(emailVerificationTokens.usedAt)))
    .limit(1);
  return !!row && row.expiresAt >= new Date();
}

// Called by the confirmVerification Server Action (the confirm button on /verify-email). Kept out of
// actions.ts so the DB code isn't re-exported from a "use server" module.
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
