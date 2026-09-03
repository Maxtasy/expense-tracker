# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Personal expense tracker (single user). Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Drizzle ORM, Supabase (Postgres), Auth.js v5 (Credentials + JWT sessions). Deployed on Vercel at https://expense-tracker-rose-ten-25.vercel.app, auto-deploying from `main`.

See [README.md](README.md) for setup, the full schema, and detailed gotchas — this file is a quick-reference, not a duplicate.

## Architecture at a glance

- **Auth**: Auth.js v5, Credentials provider only, JWT sessions (no adapter, no `sessions` table). Our own `users` table with bcrypt-hashed passwords. Signup is a custom Server Action since Auth.js only handles login.
- **Database**: Supabase Postgres, dual connection strings — `DATABASE_URL` (transaction pooler, port 6543, app runtime) vs `DATABASE_URL_MIGRATIONS` (session pooler, port 5432, `drizzle-kit` only). **Dev and production share the same database** — this is a personal single-user app, no separate environments.
- **Data model**: `users`, `categories` (global when `user_id IS NULL`, else personal; typed `expense`/`income`), `transactions` (typed `expense`/`income`, amount always stored positive, sign derived from `type` in the UI), `recurring_transactions` (a rule; `transactions.recurring_transaction_id` links a materialized row back to it).
- **Recurring transactions**: lazily materialized, not cron-driven. Viewing any month on the dashboard calls `ensureRecurringGenerated()` (`src/app/dashboard/generate-recurring.ts`), which inserts any missing `transactions` rows for that month's active rules before querying.
- **Ownership scoping**: every mutation Server Action filters `WHERE id = ? AND user_id = ?` directly — never fetch-then-check. This is what makes cross-user access structurally impossible, not just checked for.
- **UI**: dark theme, mobile-first, compact. Design tokens live in `src/app/globals.css` (`@theme` block) — use `bg-background`, `bg-surface`, `text-fg`, `text-fg-muted`, `bg-accent`, `text-danger`, `text-success`, etc. Never hardcode hex colors in components. Category rows get a deterministic color dot via `src/lib/category-color.ts`. Logo/favicon source is `src/app/icon.svg`; run `npm run icons:build` after editing it to regenerate `favicon.ico`, `apple-icon.png`, and the PWA manifest icons under `public/icons/`.
- **PWA**: `src/app/manifest.ts` (Next's file-convention manifest route) plus the icons in `public/icons/` make the deployed site installable — groundwork for the Android TWA path (M14). No service worker yet; add one only if offline support or a Lighthouse PWA score is actually needed.

## Known gotchas

- **`drizzle-kit migrate` fails silently** on some errors — the spinner just stops, no message. If it fails without explanation, run the migration through Drizzle's own migrator API directly to see the real error (snippet in README's Database section).
- **`drizzle-kit generate` can't resolve table renames without a TTY.** Renaming a table in `schema.ts` needs an interactive prompt to disambiguate rename-vs-drop+create, which crashes in non-interactive shells (`Interactive prompts require a TTY terminal`). With no real data to preserve, the fix is a clean reset: drop the `public` and `drizzle` schemas, delete `drizzle/*.sql` and `drizzle/meta/*`, then regenerate one fresh baseline migration.
- **Schema changes and production**: there's no CI migration step. Run `npm run db:migrate` locally against the shared Supabase DB before or right after pushing code that depends on the change — it's immediately live since dev and prod share the database.

## Testing conventions

- After browser-testing a feature with a throwaway account, delete it afterward (a one-off script deleting from `users` by email — cascades clean up everything else). Don't leave test accounts in the shared database.
- `src/db/test-connection.ts` is a scratch script — repurpose it for one-off queries during debugging, then restore it to the simple `SELECT 1` check when done.

## Conventions

- Server Actions live in `actions.ts` next to the page/components that use them (e.g. `src/app/dashboard/actions.ts`, `src/app/dashboard/categories/actions.ts`).
- A `<form>` wrapping a single icon button (delete, logout) needs `className="contents"` — otherwise the form's own box breaks flex alignment with sibling icon buttons/links.
- Client components that should close an edit/create form only on success use `useTransition` + a manual submit handler, not `useActionState` + a `useEffect` that calls `setState` — the latter trips the `react-hooks/set-state-in-effect` eslint rule.
