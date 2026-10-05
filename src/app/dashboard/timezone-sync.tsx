"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TIMEZONE_COOKIE } from "@/lib/timezone";

// Keeps the `tz` cookie in step with the browser's timezone (see src/lib/timezone.ts). Refreshes
// once when it changes so the server-rendered "current month" matches the person's local date.
export function TimezoneSync({ current }: { current?: string }) {
  const router = useRouter();
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz || tz === current) return;
    document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [current, router]);
  return null;
}
