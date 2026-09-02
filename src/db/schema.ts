import { pgTable, uuid, text, numeric, date, timestamp } from "drizzle-orm/pg-core";

// userId columns are plain text for now (no FK yet) since the `users` table
// doesn't exist until Milestone 4 (Auth.js). We'll add the FK constraint then.

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // null userId = global default category, shared by all users
  userId: text("user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
