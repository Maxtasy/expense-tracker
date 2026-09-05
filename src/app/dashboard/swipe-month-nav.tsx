"use client";

import { createContext, useContext, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { monthHref, shiftMonth, type YearMonth } from "@/lib/month";

const SWIPE_THRESHOLD_PX = 60;

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
          <>
            {/* Raw CSS, not Tailwind's `animate-spin`/`animate-pulse`: this project's Turbopack
                dev server has been observed to silently drop newly-added utility classes (see
                CLAUDE.md gotchas) — a loading indicator is exactly the load-bearing visual that
                can't depend on that. */}
            <style>{`
              @keyframes dashboard-loading-spin {
                to { transform: rotate(360deg); }
              }
              @keyframes dashboard-loading-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
            `}</style>
            <div
              style={{ position: "absolute", inset: 0, zIndex: 5 }}
              className="flex items-center justify-center bg-background/60 backdrop-blur-[1px]"
            >
              <div
                style={{
                  animation:
                    "dashboard-loading-spin 1.1s linear infinite, dashboard-loading-pulse 1.6s ease-in-out infinite",
                }}
              >
                <Logo size={40} />
              </div>
            </div>
          </>
        )}
      </div>
    </NavPendingContext.Provider>
  );
}
