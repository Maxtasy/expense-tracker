import Link from "next/link";
import { ArrowLeftRight, CalendarDays, Repeat } from "lucide-react";
import { Logo } from "@/components/logo";

const FEATURES = [
  {
    icon: ArrowLeftRight,
    title: "Track everything",
    description: "Log income and expenses, organized into categories you control.",
  },
  {
    icon: CalendarDays,
    title: "Monthly overview",
    description: "See income, expenses, and your net position for any month at a glance.",
  },
  {
    icon: Repeat,
    title: "Recurring made easy",
    description: "Set up salary, rent, or subscriptions once — they show up automatically every month.",
  },
];

export default function Home() {
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Logo size={20} />
          Expense Tracker
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-fg-muted hover:text-fg">
            Log in
          </Link>
          <Link href="/signup" className="rounded-lg bg-accent px-3 py-1.5 font-medium text-accent-fg hover:bg-accent-hover">
            Sign up
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-md px-4 py-10 text-center sm:max-w-lg sm:py-16">
        <h1 className="text-2xl font-semibold text-fg sm:text-3xl">Understand where your money goes</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-fg-muted">
          Track income and expenses, organize them into categories, and see your monthly position at a glance.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/signup" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover">
            Get started
          </Link>
          <Link href="/login" className="rounded-lg border border-border px-4 py-2 text-sm text-fg-muted hover:text-fg">
            Log in
          </Link>
        </div>

        <div className="mt-12 grid gap-3 text-left sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border border-border bg-surface/30 p-4">
              <Icon size={18} className="text-accent" />
              <p className="mt-3 text-sm font-medium text-fg">{title}</p>
              <p className="mt-1 text-xs text-fg-muted">{description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
