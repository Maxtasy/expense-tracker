import Link from "next/link";
import { redirect } from "next/navigation";
import { Tags, Repeat, PieChart, Settings, LogOut } from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { logout } from "./actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
          <Logo size={18} />
          Overview
        </Link>
        <nav className="flex items-center gap-4 text-fg-muted">
          <Link href="/dashboard/recurring" aria-label="Recurring transactions" className="hover:text-fg">
            <Repeat size={18} />
          </Link>
          <Link href="/dashboard/insights" aria-label="Insights" className="hover:text-fg">
            <PieChart size={18} />
          </Link>
          <Link href="/dashboard/categories" aria-label="Categories" className="hover:text-fg">
            <Tags size={18} />
          </Link>
          <Link href="/dashboard/settings" aria-label="Settings" className="hover:text-fg">
            <Settings size={18} />
          </Link>
          <form action={logout} className="contents">
            <button type="submit" aria-label="Log out" className="hover:text-fg">
              <LogOut size={18} />
            </button>
          </form>
        </nav>
      </header>
      {/* Raw CSS, not Tailwind's `md:`/`lg:` responsive utilities: this project's Turbopack dev
          server has been confirmed (via a direct `next build` + computed-style comparison) to
          not compile ANY responsive-prefixed utility in dev, since this app had none before —
          see CLAUDE.md gotchas. The tablet layout is exactly the load-bearing case that can't
          depend on that, so it's defined here as plain CSS shared by every /dashboard page. */}
      <style>{`
        @media (min-width: 768px) {
          .md-wide { max-width: 48rem !important; padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
          .dashboard-grid { display: grid; grid-template-columns: 280px 1fr; align-items: start; gap: 1rem; }
          .dashboard-sidebar { position: sticky; top: 68px; }
          .split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        }
        @media (min-width: 1024px) {
          .md-wide { max-width: 64rem !important; }
        }
      `}</style>
      <main className="md-wide mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4">{children}</main>
    </div>
  );
}
