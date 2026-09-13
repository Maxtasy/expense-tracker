import { headers } from "next/headers";

// Vercel sets x-forwarded-for as "client, proxy1, proxy2..."; the first entry is the real client.
// Falls back to "unknown" in local dev, where there's effectively no meaningful IP-based limiting.
export async function getClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
