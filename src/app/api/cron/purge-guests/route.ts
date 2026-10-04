import { deleteExpiredGuests } from "@/lib/guest";

// Called daily by Vercel Cron (see vercel.json) so expired guest accounts get cleaned up even when
// nobody starts a new guest session. Vercel sends `Authorization: Bearer $CRON_SECRET`; with no
// secret configured this refuses everything rather than leaving a public delete endpoint.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const deleted = await deleteExpiredGuests();
  return Response.json({ deleted });
}
