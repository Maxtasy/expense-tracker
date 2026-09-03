import { pgTable, uuid, text, numeric, date, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
  // null userId = global default category, shared by all users
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
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
