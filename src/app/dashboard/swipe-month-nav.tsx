"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { monthHref, shiftMonth, type YearMonth } from "@/lib/month";

const SWIPE_THRESHOLD_PX = 60;

export function SwipeMonthNav({
  current,
  category,
  sort,
  children,
}: {
  current: YearMonth;
  category: string;
  sort: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length > 1 || (e.target as Element).closest("dialog")) {
      start.current = null;
      return;
    }
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (!start.current) return;
    const dx = e.changedTouches[0].clientX - start.current.x;
    const dy = e.changedTouches[0].clientY - start.current.y;
    start.current = null;

    if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
      router.push(monthHref(shiftMonth(current, dx < 0 ? 1 : -1), category, sort));
    }
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  );
}
