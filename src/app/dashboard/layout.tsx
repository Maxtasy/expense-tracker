import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutList, Tags, Repeat, LogOut } from "lucide-react";
import { auth } from "@/auth";
import { logout } from "./actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
          <LayoutList size={18} className="text-accent" />
          Overview
        </Link>
        <nav className="flex items-center gap-4 text-fg-muted">
          <Link href="/dashboard/recurring" aria-label="Recurring transactions" className="hover:text-fg">
            <Repeat size={18} />
          </Link>
          <Link href="/dashboard/categories" aria-label="Categories" className="hover:text-fg">
            <Tags size={18} />
          </Link>
          <form action={logout} className="contents">
            <button type="submit" aria-label="Log out" className="hover:text-fg">
              <LogOut size={18} />
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-md px-4 py-4">{children}</main>
    </div>
  );
}
