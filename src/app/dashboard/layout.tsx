import Link from "next/link";
import { redirect } from "next/navigation";
import { Tags, Repeat, PieChart, Settings } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getVerificationStatus, isVerificationGracePeriodExpired, needsVerification } from "@/lib/verification";
import { guestDaysLeft, isGuestExpired } from "@/lib/guest";
import { Logo } from "@/components/logo";
import { hasCompletedOnboarding } from "@/lib/preferences-server";
import { OnboardingTour } from "./onboarding-tour";
import { VerifyEmailBanner } from "./verify-email-banner";
import { GuestBanner } from "./guest-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const t = await getTranslations("nav");

  // Defense in depth alongside auth.ts's authorize() check: a JWT session created before the
  // 7-day grace period expired stays valid past it (Auth.js doesn't re-check the DB per request),
  // so this is the backstop that actually enforces the deadline for an already-open session.
  const verification = await getVerificationStatus(session.user.id);
  // The row is gone -- in practice an expired guest that was purged. The JWT outlives it.
  if (!verification) {
    redirect("/login");
  }
  // Same backstop idea for guests: a guest session that predates the deadline must not keep
  // working past it, so delete the account here (if it isn't purged already) and send them away.
  if (verification.isGuest && isGuestExpired(verification.createdAt)) {
    await db.delete(users).where(eq(users.id, session.user.id));
    redirect("/login?guest=expired");
  }
  const isUnverified = needsVerification(verification);
  if (isUnverified && isVerificationGracePeriodExpired(verification.createdAt)) {
    redirect("/verify-email-required");
  }

  const onboarded = await hasCompletedOnboarding(session.user.id);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
          <Logo size={18} />
          {t("overview")}
        </Link>
        <nav className="flex items-center gap-2 text-fg-muted">
          <Link href="/dashboard/recurring" aria-label={t("recurring")} className="rounded-lg p-1.5 hover:text-fg">
            <Repeat size={18} />
          </Link>
          <Link href="/dashboard/insights" aria-label={t("insights")} className="rounded-lg p-1.5 hover:text-fg">
            <PieChart size={18} />
          </Link>
          <Link href="/dashboard/categories" aria-label={t("categories")} className="rounded-lg p-1.5 hover:text-fg">
            <Tags size={18} />
          </Link>
          <Link href="/dashboard/settings" aria-label={t("settings")} className="rounded-lg p-1.5 hover:text-fg">
            <Settings size={18} />
          </Link>
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
      <main className="md-wide mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4">
        {verification.isGuest && <GuestBanner daysLeft={guestDaysLeft(verification.createdAt)} />}
        {isUnverified && verification.email && <VerifyEmailBanner email={verification.email} />}
        {children}
      </main>
      {!onboarded && <OnboardingTour autoOpen />}
    </div>
  );
}
