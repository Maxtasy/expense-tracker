import { Logo } from '@/components/logo';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Delete your account — Expense Tracker',
};

const CONTACT_EMAIL = 'contact@maxtasy.me';

const headingClass = 'text-base font-semibold text-fg';
const bodyClass = 'text-sm text-fg-muted leading-relaxed';

// Public page Google Play's Data safety form links to as the "delete account" web resource, so it
// has to work for someone who isn't logged in. English-only like /privacy (see CLAUDE.md).
export default function DeleteAccountPage() {
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
        <h1 className="text-2xl font-semibold text-fg">Delete your account</h1>
        <p className="mt-1 text-xs text-fg-muted">Expense Tracker</p>

        <div className="mt-8 space-y-8">
          <section className="space-y-2">
            <h2 className={headingClass}>Delete it yourself, in the app</h2>
            <ol className={`${bodyClass} list-decimal space-y-1 pl-5`}>
              <li>
                <Link href="/login" className="text-accent-text hover:text-accent-hover">
                  Log in
                </Link>{' '}
                (in the website or the Android app).
              </li>
              <li>
                Open <strong className="text-fg">Settings</strong> (the gear icon).
              </li>
              <li>
                Scroll to <strong className="text-fg">Delete account</strong> and choose it.
              </li>
              <li>Confirm, and enter your password.</li>
            </ol>
            <p className={bodyClass}>
              Your account is deleted immediately and you are signed out. Guest accounts
              (&ldquo;Try without an account&rdquo;) can be deleted the same way, without a password.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={headingClass}>What gets deleted</h2>
            <p className={bodyClass}>
              Your email address, password hash, settings, and all of your transactions, recurring
              transactions, and personal categories are permanently removed from the live database.
              This can&rsquo;t be undone. Data may remain in encrypted backups for up to about 30
              days before being overwritten; backups are only ever used to recover from data loss.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={headingClass}>Can&rsquo;t log in?</h2>
            <p className={bodyClass}>
              If you no longer have access to your account, email us from the address you signed up
              with at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-text hover:text-accent-hover">
                {CONTACT_EMAIL}
              </a>{' '}
              and we&rsquo;ll delete the account and its data for you.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
