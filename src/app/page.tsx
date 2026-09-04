import Image from "next/image";
import Link from "next/link";
import { ArrowLeftRight, CalendarDays, FileSpreadsheet, Repeat } from "lucide-react";
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
  {
    icon: FileSpreadsheet,
    title: "Your data, backed up",
    description: "Export everything to CSV any time, and restore it in a couple of clicks whenever you need to.",
  },
];

const SCREENSHOTS = [
  {
    src: "/landing/dashboard.png",
    alt: "Dashboard showing monthly income, expenses, net total, and a categorized list of transactions",
    caption: "Monthly overview",
  },
  {
    src: "/landing/insights.png",
    alt: "Insights page showing income and expenses broken down by category in pie charts",
    caption: "Category breakdown",
  },
  {
    src: "/landing/settings.png",
    alt: "Settings page with CSV export links for categories, recurring transactions, and transactions, and an import form",
    caption: "Export & import your data",
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
        <h1 className="text-2xl font-semibold text-fg sm:text-3xl">
          <span className="font-bold text-accent">Understand why</span> every month feels like there&rsquo;s{" "}
          <span className="font-bold text-accent">no money left</span> over.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-fg-muted">
          Small purchases add up without you noticing. Track where it&rsquo;s really going, and know what you have left
          before the month runs out — then start setting some aside for a rainy day.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/signup" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover">
            Get started
          </Link>
          <Link href="/login" className="rounded-lg border border-border px-4 py-2 text-sm text-fg-muted hover:text-fg">
            Log in
          </Link>
        </div>

        <div className="mt-12 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border border-border bg-surface/30 p-4">
              <Icon size={18} className="text-accent" />
              <p className="mt-3 text-sm font-medium text-fg">{title}</p>
              <p className="mt-1 text-xs text-fg-muted">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 sm:mt-28">
          <h2 className="text-lg font-semibold text-fg sm:text-xl">See it in action</h2>
          <div className="mt-6 flex flex-col flex-wrap items-center justify-center gap-8 sm:flex-row">
            {SCREENSHOTS.map(({ src, alt, caption }) => (
              <figure key={src} className="w-full max-w-[220px]">
                <div className="overflow-hidden rounded-[1.75rem] border border-border shadow-2xl shadow-black/40">
                  <Image src={src} alt={alt} width={780} height={1688} className="h-auto w-full" />
                </div>
                <figcaption className="mt-3 text-xs text-fg-muted">{caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
