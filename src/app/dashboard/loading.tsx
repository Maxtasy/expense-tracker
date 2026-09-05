import { Logo } from "@/components/logo";

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16">
      {/* Raw CSS, not Tailwind's `animate-spin`/`animate-pulse`: this project's Turbopack dev
          server has been observed to silently drop newly-added utility classes (see CLAUDE.md
          gotchas) — a loading indicator is exactly the kind of load-bearing visual that can't
          depend on that. */}
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
        style={{
          animation: "dashboard-loading-spin 1.1s linear infinite, dashboard-loading-pulse 1.6s ease-in-out infinite",
        }}
      >
        <Logo size={40} />
      </div>
    </div>
  );
}
