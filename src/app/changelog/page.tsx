import { History } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { CHANGELOG } from "@/content/changelog";

export const metadata: Metadata = {
  title: "Changelog — Expense Tracker",
};

export default function ChangelogPage() {
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Logo size={20} />
          Expense Tracker
        </Link>
        <Link href="/" className="text-sm text-fg-muted hover:text-fg">
          Back home
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-4 sm:px-6">
        <History size={22} className="text-accent" />
        <h1 className="mt-3 text-2xl font-semibold text-fg">Changelog</h1>
        <p className="mt-2 text-sm text-fg-muted leading-relaxed">
          Everything that&rsquo;s shipped so far, newest first. Internal cleanup and behind-the-scenes
          work aren&rsquo;t listed here — just what actually changes for you.
        </p>

        <div className="mt-8 space-y-8">
          {CHANGELOG.map((entry) => (
            <section key={entry.version} className="border-t border-border pt-6 first:border-t-0 first:pt-0">
              <div className="flex items-baseline gap-3">
                <h2 className="text-base font-semibold text-fg">v{entry.version}</h2>
                <span className="text-xs text-fg-muted">
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {entry.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-fg-muted leading-relaxed">
                    <span
                      className="shrink-0 rounded-full"
                      style={{ width: 4, height: 4, marginTop: 8, backgroundColor: "var(--color-fg-muted)" }}
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
