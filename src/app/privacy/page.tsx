import { Logo } from '@/components/logo';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Expense Tracker',
};

const CONTACT_EMAIL = 'contact@maxtasy.me';
const LAST_UPDATED = 'September 3, 2026';

const sectionClass = 'space-y-2';
const headingClass = 'text-base font-semibold text-fg';
const bodyClass = 'text-sm text-fg-muted leading-relaxed';

export default function PrivacyPage() {
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
        <h1 className="text-2xl font-semibold text-fg">Privacy Policy</h1>
        <p className="mt-1 text-xs text-fg-muted">Last updated {LAST_UPDATED}</p>

        <div className="mt-8 space-y-8">
          <section className={sectionClass}>
            <p className={bodyClass}>
              Expense Tracker (&ldquo;the app&rdquo;) is an independently run, single-developer app
              for tracking personal income and expenses. This page explains what data the app
              collects, how it&rsquo;s used, and how you can control it.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Data we collect</h2>
            <p className={bodyClass}>
              <strong className="text-fg">Account data.</strong> Your email address and password.
              Passwords are hashed (bcrypt) before storage — we never store or can see your
              plain-text password.
            </p>
            <p className={bodyClass}>
              <strong className="text-fg">Financial data you enter.</strong> Transaction amounts,
              descriptions, dates, categories, and recurring transaction rules that you add
              yourself. The app does not connect to bank accounts or cards, and does not import
              financial data automatically — everything comes from what you type in.
            </p>
            <p className={bodyClass}>
              We don&rsquo;t collect analytics, advertising identifiers, or any usage tracking
              beyond what&rsquo;s needed to keep you signed in (a session cookie).
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>How we use your data</h2>
            <p className={bodyClass}>
              Solely to provide the app&rsquo;s core functionality: storing and displaying your
              transactions, categories, and the summaries and charts built from them. We do not use
              your data for advertising, and we do not sell or share it with third parties for their
              own purposes.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Where your data is stored</h2>
            <p className={bodyClass}>
              Your data is stored in a Postgres database hosted by{' '}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-hover"
              >
                Supabase
              </a>
              , and the app itself is hosted on{' '}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-hover"
              >
                Vercel
              </a>
              . These providers process data on our behalf as infrastructure providers, under their
              own security and privacy practices — we don&rsquo;t share your data with them for any
              other purpose.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Security</h2>
            <p className={bodyClass}>
              Data is transmitted over HTTPS. Passwords are hashed with bcrypt before being stored.
              Sign-in sessions use signed, HTTP-only cookies. Every request for your data is scoped
              to your account, so other users of the app cannot see or access your transactions or
              categories.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Data retention and deletion</h2>
            <p className={bodyClass}>
              Your data is kept for as long as your account exists. To request deletion of your
              account and all associated data, or to request a copy of your data, email us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:text-accent-hover">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Children&rsquo;s privacy</h2>
            <p className={bodyClass}>
              The app is not directed at children, and we do not knowingly collect data from
              children under 13.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Changes to this policy</h2>
            <p className={bodyClass}>
              If this policy changes, we&rsquo;ll update the date at the top of this page.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Contact</h2>
            <p className={bodyClass}>
              Questions about this policy or your data? Email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:text-accent-hover">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
