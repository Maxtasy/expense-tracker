"use server";

import { z } from "zod";
import { eq, isNull } from "drizzle-orm";
import { parse } from "csv-parse/sync";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, recurringTransactions, transactions } from "@/db/schema";

const typeSchema = z.enum(["expense", "income"]);
const amountSchema = z.string().refine((v) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) > 0, {
  message: "Amount must be a positive number",
});

const categoryRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(50),
  type: typeSchema,
  is_global: z.enum(["true", "false"]),
});

const recurringRowSchema = z.object({
  id: z.string().min(1),
  type: typeSchema,
  category_id: z.string(),
  amount: amountSchema,
  description: z.string(),
  start_date: z.string().min(1),
  end_date: z.string(),
});

const transactionRowSchema = z.object({
  id: z.string().min(1),
  type: typeSchema,
  category_id: z.string(),
  recurring_transaction_id: z.string(),
  amount: amountSchema,
  description: z.string(),
  date: z.string().min(1),
});

function parseCsv(text: string, label: string): Record<string, string>[] {
  try {
    return parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  } catch {
    throw new Error(`Could not parse ${label} as CSV`);
  }
}

function checkDuplicateIds(rows: { id: string }[], label: string) {
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.id)) throw new Error(`${label} has a duplicate id: ${row.id}`);
    seen.add(row.id);
  }
}

export type ImportState = { error?: string; success?: boolean } | null;

export async function importData(_prevState: ImportState, formData: FormData): Promise<ImportState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be logged in" };
  }
  const userId = session.user.id;

  const categoriesFile = formData.get("categoriesFile");
  const recurringFile = formData.get("recurringFile");
  const transactionsFile = formData.get("transactionsFile");
  if (!(categoriesFile instanceof File) || !(recurringFile instanceof File) || !(transactionsFile instanceof File)) {
    return { error: "All three CSV files are required" };
  }
  if (categoriesFile.size === 0 || recurringFile.size === 0 || transactionsFile.size === 0) {
    return { error: "All three CSV files are required" };
  }

  let categoryRows: z.infer<typeof categoryRowSchema>[];
  let recurringRows: z.infer<typeof recurringRowSchema>[];
  let transactionRows: z.infer<typeof transactionRowSchema>[];

  try {
    const rawCategories = parseCsv(await categoriesFile.text(), "categories.csv");
    categoryRows = rawCategories.map((row, i) => {
      const parsed = categoryRowSchema.safeParse(row);
      if (!parsed.success) throw new Error(`categories.csv row ${i + 2}: ${parsed.error.issues[0].message}`);
      return parsed.data;
    });
    checkDuplicateIds(categoryRows, "categories.csv");

    const rawRecurring = parseCsv(await recurringFile.text(), "recurring_transactions.csv");
    recurringRows = rawRecurring.map((row, i) => {
      const parsed = recurringRowSchema.safeParse(row);
      if (!parsed.success) throw new Error(`recurring_transactions.csv row ${i + 2}: ${parsed.error.issues[0].message}`);
      return parsed.data;
    });
    checkDuplicateIds(recurringRows, "recurring_transactions.csv");

    const rawTransactions = parseCsv(await transactionsFile.text(), "transactions.csv");
    transactionRows = rawTransactions.map((row, i) => {
      const parsed = transactionRowSchema.safeParse(row);
      if (!parsed.success) throw new Error(`transactions.csv row ${i + 2}: ${parsed.error.issues[0].message}`);
      return parsed.data;
    });
    checkDuplicateIds(transactionRows, "transactions.csv");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to parse CSV files" };
  }

  const categoryIds = new Set(categoryRows.map((r) => r.id));
  for (const row of recurringRows) {
    if (row.category_id && !categoryIds.has(row.category_id)) {
      return { error: `recurring_transactions.csv row references unknown category_id "${row.category_id}"` };
    }
  }
  const recurringIds = new Set(recurringRows.map((r) => r.id));
  for (const row of transactionRows) {
    if (row.category_id && !categoryIds.has(row.category_id)) {
      return { error: `transactions.csv row references unknown category_id "${row.category_id}"` };
    }
    if (row.recurring_transaction_id && !recurringIds.has(row.recurring_transaction_id)) {
      return { error: `transactions.csv row references unknown recurring_transaction_id "${row.recurring_transaction_id}"` };
    }
  }

  const existingGlobalCategories = await db
    .select({ id: categories.id, name: categories.name, type: categories.type })
    .from(categories)
    .where(isNull(categories.userId));

  for (const row of categoryRows) {
    if (row.is_global === "true") {
      const match = existingGlobalCategories.find(
        (c) => c.type === row.type && c.name.toLowerCase() === row.name.toLowerCase(),
      );
      if (!match) {
        return { error: `categories.csv references global category "${row.name}" (${row.type}) which doesn't exist` };
      }
    }
  }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(transactions).where(eq(transactions.userId, userId));
      await tx.delete(recurringTransactions).where(eq(recurringTransactions.userId, userId));
      await tx.delete(categories).where(eq(categories.userId, userId));

      const categoryIdMap = new Map<string, string>();
      for (const row of categoryRows) {
        if (row.is_global === "true") {
          const match = existingGlobalCategories.find(
            (c) => c.type === row.type && c.name.toLowerCase() === row.name.toLowerCase(),
          );
          if (!match) throw new Error(`Global category "${row.name}" (${row.type}) not found`);
          categoryIdMap.set(row.id, match.id);
        } else {
          const [inserted] = await tx
            .insert(categories)
            .values({ name: row.name, type: row.type, userId })
            .returning({ id: categories.id });
          categoryIdMap.set(row.id, inserted.id);
        }
      }

      const recurringIdMap = new Map<string, string>();
      for (const row of recurringRows) {
        const categoryId = row.category_id ? categoryIdMap.get(row.category_id) : undefined;
        if (row.category_id && !categoryId) throw new Error(`Unknown category_id "${row.category_id}"`);
        const [inserted] = await tx
          .insert(recurringTransactions)
          .values({
            userId,
            type: row.type,
            categoryId: categoryId ?? null,
            amount: Number(row.amount).toFixed(2),
            description: row.description || null,
            startDate: row.start_date,
            endDate: row.end_date || null,
          })
          .returning({ id: recurringTransactions.id });
        recurringIdMap.set(row.id, inserted.id);
      }

      for (const row of transactionRows) {
        const categoryId = row.category_id ? categoryIdMap.get(row.category_id) : undefined;
        if (row.category_id && !categoryId) throw new Error(`Unknown category_id "${row.category_id}"`);
        const recurringTransactionId = row.recurring_transaction_id
          ? recurringIdMap.get(row.recurring_transaction_id)
          : undefined;
        if (row.recurring_transaction_id && !recurringTransactionId) {
          throw new Error(`Unknown recurring_transaction_id "${row.recurring_transaction_id}"`);
        }
        await tx.insert(transactions).values({
          userId,
          type: row.type,
          categoryId: categoryId ?? null,
          recurringTransactionId: recurringTransactionId ?? null,
          amount: Number(row.amount).toFixed(2),
          description: row.description || null,
          date: row.date,
        });
      }
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Import failed" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/recurring");
  revalidatePath("/dashboard/insights");
  return { success: true };
}
