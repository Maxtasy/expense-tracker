"use client";

import { createContext, useContext, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CoinLoader } from "@/components/coin-loader";
import { shiftMonth, type YearMonth } from "@/lib/month";

export type InsightsType = "expense" | "income" | "all";

const SWIPE_THRESHOLD_PX = 60;

export function insightsHref(mode: "month" | "year", month: string, type: InsightsType) {
  return `/dashboard/insights?mode=${mode}&month=${month}&type=${type}`;
}

function monthString({ year, month }: YearMonth) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// Falls back to setTimeout since requestIdleCallback isn't available in Safari/iOS.
function onIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback);
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 1000);
  return () => window.clearTimeout(id);
}

const NavContext = createContext<((href: string) => void) | null>(null);

// Every insights control (type/period toggles, pagers) navigates through here so they all share
// the same pending overlay, and swiping left/right pages the period like the overview does.
export function InsightsNav({
  mode,
  current,
  type,
  children,
}: {
  mode: "month" | "year";
  current: YearMonth;
  type: InsightsType;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const start = useRef<{ x: number; y: number } | null>(null);

  const step = (delta: number) => {
    const target = mode === "year" ? { year: current.year + delta, month: current.month } : shiftMonth(current, delta);
    return insightsHref(mode, monthString(target), type);
  };

  useEffect(() => {
    return onIdle(() => {
      router.prefetch(step(-1));
      router.prefetch(step(1));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitives so an equal-but-new `current` object doesn't reschedule
  }, [router, mode, current.year, current.month, type]);

  function navigate(href: string) {
    startTransition(() => router.push(href));
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    // ignore pinch gestures and anything inside a dialog
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
      navigate(step(dx < 0 ? 1 : -1));
    }
  }

  return (
    <NavContext.Provider value={navigate}>
      <div className="relative flex flex-1 flex-col" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {children}
        {isPending && (
          <div
            style={{ position: "absolute", inset: 0, zIndex: 5 }}
            className="flex items-center justify-center bg-background/60 backdrop-blur-[1px]"
          >
            <CoinLoader size={48} />
          </div>
        )}
      </div>
    </NavContext.Provider>
  );
}

// A plain <a> (so open-in-new-tab and middle click still work) whose normal click goes through the
// shared pending transition instead of a full page load.
export function InsightsLink({ href, children, ...rest }: Omit<React.ComponentProps<"a">, "href"> & { href: string }) {
  const navigate = useContext(NavContext);
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        if (!navigate || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
