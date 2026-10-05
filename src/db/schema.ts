import { sql } from "drizzle-orm";
import { pgTable, uuid, text, numeric, date, timestamp, integer, boolean, unique, uniqueIndex, index } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // email and passwordHash are null only for guest accounts (is_guest = true) -- see src/lib/guest.ts.
    // Postgres treats NULLs as distinct, so the unique constraint still allows any number of guests.
    email: text("email").unique(),
    passwordHash: text("password_hash"),
    // a "Try without an account" user: a real row (so all ownership scoping just works) that's
    // purged after GUEST_TTL_DAYS unless the person adds an email + password first
    isGuest: boolean("is_guest").notNull().default(false),
    name: text("name"),
    currency: text("currency").notNull().default("EUR"),
    locale: text("locale").notNull().default("en"),
    // "auto" = the locale's default date format; see src/lib/date-format.ts for the other values
    dateFormat: text("date_format").notNull().default("auto"),
    // "dark" | "light" | "system" -- see src/lib/theme.ts
    theme: text("theme").notNull().default("dark"),
    // opt-in: preselect the category last used (per type) in the add-transaction form
    rememberLastCategory: boolean("remember_last_category").notNull().default(false),
    // null = hasn't seen the first-run tour yet (see src/app/dashboard/onboarding-tour.tsx)
    onboardedAt: timestamp("onboarded_at"),
    // null = not verified yet. Verification is a 7-day grace period, not an immediate hard block --
    // see the authorize() callback in src/auth.ts and the layout check in src/app/dashboard/layout.tsx.
    emailVerifiedAt: timestamp("email_verified_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  // emails are stored lowercase (see src/lib/email-address.ts); this makes that a hard guarantee
  (table) => [uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`)],
);

// a single-use, short-lived token issued when a user requests a password reset email; the token
// itself is never stored, only its sha256 hash, so a leaked DB row can't be used to reset a password
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// same shape as passwordResetTokens -- a single-use, sha256-hashed token sent in the "verify your
// email" link
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// records each login/signup/resend attempt so isRateLimited() can count how many happened
// recently for a given email or IP -- see src/lib/rate-limit.ts
export const authAttempts = pgTable(
  "auth_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind", { enum: ["login", "signup", "resend_verification", "guest", "forgot_password"] }).notNull(),
    email: text("email"),
    ip: text("ip").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("auth_attempts_kind_created_idx").on(table.kind, table.createdAt),
    index("auth_attempts_email_idx").on(table.email),
    index("auth_attempts_ip_idx").on(table.ip),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
    // null userId = global default category, shared by all users
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    // hex string (e.g. "#38bdf8"); null = fall back to the deterministic name-hash color
    color: text("color"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  // case-insensitive name uniqueness among a user's own categories (global ones are checked in the actions)
  (table) => [
    uniqueIndex("categories_user_name_unique")
      .on(table.userId, sql`lower(${table.name})`)
      .where(sql`${table.userId} is not null`),
  ],
);

// a global (default) category a user has chosen to hide from their own category list — never
// touches the shared category row itself, since that would affect every other user
export const hiddenCategories = pgTable(
  "hidden_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.userId, table.categoryId)],
);

export const recurringTransactions = pgTable("recurring_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  // day-of-month is derived from startDate; startDate's (year, month) is the first month it applies
  startDate: date("start_date").notNull(),
  // last (year, month) it applies to; null = recurs indefinitely
  endDate: date("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// records that a single materialized occurrence of a recurring rule was deleted on purpose, so
// ensureRecurringGenerated() doesn't recreate it when that month is viewed again
export const recurringTransactionSkips = pgTable(
  "recurring_transaction_skips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recurringTransactionId: uuid("recurring_transaction_id")
      .notNull()
      .references(() => recurringTransactions.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.recurringTransactionId, table.year, table.month)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    recurringTransactionId: uuid("recurring_transaction_id").references(() => recurringTransactions.id, { onDelete: "set null" }),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    description: text("description"),
    date: date("date").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  // one materialized occurrence per rule per month (guards against concurrent ensureRecurringGenerated runs)
  (table) => [
    uniqueIndex("transactions_recurring_month_unique")
      .on(table.recurringTransactionId, sql`(date_trunc('month', ${table.date}::timestamp)::date)`)
      .where(sql`${table.recurringTransactionId} is not null`),
  ],
);
