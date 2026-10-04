import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

// A guest account is a normal users row without an email/password. It lives this long from
// creation; after that it's deleted (cascades take the rest of its data) unless the person has
// upgraded it to a full account in Settings first.
export const GUEST_TTL_DAYS = 30;
const GUEST_TTL_MS = GUEST_TTL_DAYS * 24 * 60 * 60 * 1000;

export function isGuestExpired(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() > GUEST_TTL_MS;
}

// Whole days left, rounded up so the last partial day still reads "1 day".
export function guestDaysLeft(createdAt: Date): number {
  return Math.max(1, Math.ceil((createdAt.getTime() + GUEST_TTL_MS - Date.now()) / (24 * 60 * 60 * 1000)));
}

// Opportunistic housekeeping, run whenever a new guest is created (same approach as the
// auth_attempts cleanup in rate-limit.ts -- no cron needed). The dashboard layout also deletes an
// expired guest the moment they next open the app, so nobody can keep using one past its deadline.
export async function deleteExpiredGuests() {
  await db.delete(users).where(and(eq(users.isGuest, true), lt(users.createdAt, new Date(Date.now() - GUEST_TTL_MS))));
}
