import { pgTable, uuid, text, numeric, date, timestamp, integer, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  currency: text("currency").notNull().default("EUR"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
  // null userId = global default category, shared by all users
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  // hex string (e.g. "#38bdf8"); null = fall back to the deterministic name-hash color
  color: text("color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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

export const transactions = pgTable("transactions", {
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
});
