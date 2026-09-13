import { and, eq, gt, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { authAttempts } from "@/db/schema";

type AttemptKind = "login" | "signup" | "resend_verification";

const WINDOW_MS: Record<AttemptKind, number> = {
  login: 15 * 60 * 1000,
  signup: 60 * 60 * 1000,
  resend_verification: 60 * 60 * 1000,
};

const MAX_ATTEMPTS: Record<AttemptKind, number> = {
  login: 5,
  signup: 5,
  resend_verification: 3,
};

// login is limited by email OR ip (either maxing out blocks it); signup/resend are ip-only,
// since the email side of those doesn't identify an existing account the same way login's does.
export async function isRateLimited(kind: AttemptKind, params: { email?: string; ip: string }) {
  const windowStart = new Date(Date.now() - WINDOW_MS[kind]);
  const scope = params.email ? or(eq(authAttempts.email, params.email), eq(authAttempts.ip, params.ip)) : eq(authAttempts.ip, params.ip);

  const rows = await db
    .select({ id: authAttempts.id })
    .from(authAttempts)
    .where(and(eq(authAttempts.kind, kind), gt(authAttempts.createdAt, windowStart), scope))
    .limit(MAX_ATTEMPTS[kind]);

  return rows.length >= MAX_ATTEMPTS[kind];
}

export async function recordAttempt(kind: AttemptKind, params: { email?: string; ip: string }) {
  await db.insert(authAttempts).values({ kind, email: params.email, ip: params.ip });
  // Opportunistic housekeeping so this table doesn't grow unbounded -- no cron needed since every
  // real kind's window is well under 24h, so anything older than that is never read again.
  await db.delete(authAttempts).where(lt(authAttempts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
}
