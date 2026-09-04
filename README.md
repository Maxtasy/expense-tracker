# Expense Tracker

A personal expense tracker built with Next.js (App Router), TypeScript, Drizzle ORM, Supabase (Postgres), and Auth.js.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your own values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Schema lives in [`src/db/schema.ts`](src/db/schema.ts). Migrations are generated and applied with `drizzle-kit`:

```bash
npm run db:generate   # generate a migration from schema.ts changes
npm run db:migrate    # apply pending migrations
npm run db:seed       # insert default global categories (idempotent)
npm run db:seed-demo  # (re)create a standing demo account with sample data, for testing/screenshots
npm run db:studio     # open Drizzle Studio to browse tables
```

`db:seed-demo` reads `DEMO_ACCOUNT_EMAIL` / `DEMO_ACCOUNT_PASSWORD` from `.env.local` and wipes + rebuilds just that one account's data — safe to re-run any time you need a clean, realistic dataset.

### Two connection strings

`.env.local` has both `DATABASE_URL` and `DATABASE_URL_MIGRATIONS`, pointing at different Supabase poolers:

- `DATABASE_URL` — **Transaction pooler** (port `6543`), used by the app at runtime.
- `DATABASE_URL_MIGRATIONS` — **Session pooler** (port `5432`), used only by `drizzle-kit`.

Migrations need session-level features (e.g. advisory locks) that transaction-mode pooling doesn't support, so they're kept on a separate connection.

### Gotcha: `drizzle-kit migrate` fails silently

`npm run db:migrate` can exit with a non-zero code and **no error message at all** when a migration fails — you just see the spinner stop. This happened when a generated migration tried to `ALTER COLUMN ... SET DATA TYPE uuid` on a column that Postgres couldn't auto-cast (it needs an explicit `USING column::uuid`, even if every existing value is `NULL`); `drizzle-kit`'s CLI swallowed the real Postgres error and gave no clue why it failed.

**If `db:migrate` fails without explanation**, don't just retry — run the migration through Drizzle's own migrator API directly to see the real error:

```ts
// scratch script, e.g. src/db/migrate-debug.ts (delete when done)
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL_MIGRATIONS!, { prepare: false, max: 1 });
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migration succeeded");
} catch (err) {
  console.error("Migration failed with error:", err);
} finally {
  await client.end();
  process.exit(0);
}
```

Run with `node --env-file=.env.local --import tsx src/db/migrate-debug.ts`. Once you see the actual Postgres error, fix the generated SQL in `drizzle/*.sql` directly (e.g. add the `USING` clause) and re-run `npm run db:migrate` — the edited file will apply normally since it was never recorded as applied.

### Gotcha: `drizzle-kit generate` can't resolve table renames non-interactively

When a table is renamed in `schema.ts` (e.g. `expenses` → `transactions`), `drizzle-kit generate` needs to ask "was this a rename or a drop+create?" via an interactive terminal prompt. In a non-TTY environment (CI, an agent's sandboxed shell, etc.) this just crashes with `Interactive prompts require a TTY terminal`, and there's no flag to answer it non-interactively.

If you hit this with no real data to preserve, the practical fix is a clean reset: drop the `public` and `drizzle` schemas, delete everything under `drizzle/` (the `.sql` files and `meta/`), then run `npm run db:generate` again — with no prior snapshot to diff against, it generates one fresh baseline migration matching the current `schema.ts` exactly, no prompt needed. Apply it with `npm run db:migrate` and reseed.

### Schema

- `users`, `categories` (global when `user_id IS NULL`, personal otherwise; scoped by `type`: `"expense"` or `"income"`), `transactions` (also typed `"expense"` / `"income"`, amount always stored positive — sign is derived from `type` in the UI), `recurring_transactions` (a rule; `transactions.recurring_transaction_id` links a materialized row back to the rule that generated it).

## Auth

Auth.js (`next-auth@5`) with a Credentials provider and JWT sessions (no adapter, no `sessions` table — see [`src/auth.ts`](src/auth.ts)). Signup is handled by our own Server Action (`src/app/signup/actions.ts`) since Auth.js only verifies logins, not registration.

`AUTH_SECRET` in `.env.local` can be regenerated any time with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Deployment

Deployed on Vercel, connected to the GitHub repo for auto-deploy on every push to `main`.

- **Database**: production uses the same Supabase project as development (this is a personal single-user app, no need for separate environments).
- **Vercel environment variables**: only `DATABASE_URL` (the Transaction pooler string) and `AUTH_SECRET` (a separate secret from the dev one in `.env.local`, generated the same way). `DATABASE_URL_MIGRATIONS` is **not** set in Vercel — it's a `drizzle-kit`-only, local-machine concern.
- **Schema changes going forward**: since there's no CI migration step, run `npm run db:migrate` locally (against the shared Supabase DB) before or right after pushing a change that depends on it — the deployed app and your local dev environment share the same database, so a migration applied locally is immediately live.
- `trustHost: true` is set in [`src/auth.ts`](src/auth.ts) so Auth.js trusts the `Host`/`X-Forwarded-Host` headers Vercel's proxy sets, rather than requiring a hardcoded canonical URL.
