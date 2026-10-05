import { and, eq, gt, lt, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { authAttempts } from "@/db/schema";

type AttemptKind = "login" | "signup" | "resend_verification" | "guest" | "forgot_password";

const WINDOW_MS: Record<AttemptKind, number> = {
  login: 15 * 60 * 1000,
  signup: 60 * 60 * 1000,
  resend_verification: 60 * 60 * 1000,
  guest: 60 * 60 * 1000,
  forgot_password: 60 * 60 * 1000,
};

const MAX_ATTEMPTS: Record<AttemptKind, number> = {
  login: 5,
  signup: 5,
  resend_verification: 3,
  guest: 10,
  forgot_password: 5,
};

// Everything is limited per IP. Keying the main budget on the submitted email would let anyone lock
// a victim out by guessing wrong against their address, so email only gets a much higher ceiling
// (EMAIL_MAX_ATTEMPTS) that still stops a brute force spread across many IPs but can't be tripped
// with a handful of requests.
const EMAIL_MAX_ATTEMPTS: Partial<Record<AttemptKind, number>> = {
  login: 30,
};

async function countAttempts(kind: AttemptKind, scope: SQL | undefined, limit: number) {
  const windowStart = new Date(Date.now() - WINDOW_MS[kind]);
  const rows = await db
    .select({ id: authAttempts.id })
    .from(authAttempts)
    .where(and(eq(authAttempts.kind, kind), gt(authAttempts.createdAt, windowStart), scope))
    .limit(limit);
  return rows.length;
}

export async function isRateLimited(kind: AttemptKind, params: { email?: string; ip: string }) {
  if ((await countAttempts(kind, eq(authAttempts.ip, params.ip), MAX_ATTEMPTS[kind])) >= MAX_ATTEMPTS[kind]) {
    return true;
  }
  const emailMax = EMAIL_MAX_ATTEMPTS[kind];
  if (params.email && emailMax) {
    return (await countAttempts(kind, eq(authAttempts.email, params.email), emailMax)) >= emailMax;
  }
  return false;
}

export async function recordAttempt(kind: AttemptKind, params: { email?: string; ip: string }) {
  await db.insert(authAttempts).values({ kind, email: params.email, ip: params.ip });
  // Opportunistic housekeeping so this table doesn't grow unbounded -- no cron needed since every
  // real kind's window is well under 24h, so anything older than that is never read again.
  await db.delete(authAttempts).where(lt(authAttempts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
}
