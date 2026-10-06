import { headers } from "next/headers";

// Origin used in links sent by email (password reset, email verification). Never derived from the
// request's Host header in production: a forged Host would put an attacker's domain into a real
// link. APP_URL wins when set; otherwise Vercel's own system variables identify the deployment.
// Only local dev falls back to the Host header, since its port isn't fixed.
export async function getBaseUrl() {
  const configured = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;

  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
