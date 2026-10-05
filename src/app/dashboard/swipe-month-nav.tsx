"use client";

import { createContext, useContext, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CoinLoader } from "@/components/coin-loader";
import { monthHref, shiftMonth, type YearMonth } from "@/lib/month";
// PrefetchKind isn't part of next/navigation's public API, but router.prefetch()'s default
// "auto" kind only prefetches the shared shell for a fully dynamic route like this one (it
// reads the session per request) — confirmed by checking the network tab, no request fired
// for the adjacent month's data at all. Type-only import so nothing internal ships at runtime.
import type { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";

const SWIPE_THRESHOLD_PX = 60;

// Falls back to setTimeout since requestIdleCallback isn't available in Safari/iOS,
// which matters here since this is a PWA.
function onIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback);
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 1000);
  return () => window.clearTimeout(id);
}

const NavPendingContext = createContext<{ navigate: (href: string) => void } | null>(null);

export function useNavigate() {
  const ctx = useContext(NavPendingContext);
  if (!ctx) throw new Error("useNavigate must be used within SwipeMonthNav");
  return ctx.navigate;
}

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
  const [isPending, startTransition] = useTransition();
  const start = useRef<{ x: number; y: number } | null>(null);

  // Neither month-pager button nor the swipe gesture is a next/link, so unlike a normal
  // route this pager gets no automatic prefetch — warm the adjacent months' route once the
  // main thread is idle instead of waiting for the user to actually navigate.
  useEffect(() => {
    return onIdle(() => {
      router.prefetch(monthHref(shiftMonth(current, -1), category, sort), { kind: "full" as PrefetchKind });
      router.prefetch(monthHref(shiftMonth(current, 1), category, sort), { kind: "full" as PrefetchKind });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitives so an equal-but-new `current` object doesn't reschedule
  }, [router, current.year, current.month, category, sort]);

  function navigate(href: string) {
    startTransition(() => router.push(href));
  }

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
      navigate(monthHref(shiftMonth(current, dx < 0 ? 1 : -1), category, sort));
    }
  }

  return (
    <NavPendingContext.Provider value={{ navigate }}>
      <div className="relative flex flex-1 flex-col" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {children}
        {isPending && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 5 }}
            className="flex items-center justify-center bg-background/60 backdrop-blur-[1px]"
          >
            <CoinLoader size={48} />
          </div>
        )}
      </div>
    </NavPendingContext.Provider>
  );
}
