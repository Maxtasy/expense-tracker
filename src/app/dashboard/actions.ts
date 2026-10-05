"use server";

import { z } from "zod";
import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { recurringTransactionSkips, transactions, users } from "@/db/schema";
import { amountField, dateField, isUsableCategory } from "@/lib/validation";

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

export async function completeOnboarding() {
  const session = await auth();
  if (!session?.user) return;
  await db
    .update(users)
    .set({ onboardedAt: new Date() })
    .where(and(eq(users.id, session.user.id), isNull(users.onboardedAt)));
}

async function buildTransactionSchema() {
  const t = await getTranslations("validation");
  return z.object({
    type: z.enum(["expense", "income"]),
    amount: amountField(t("amountPositive"), t("amountTooLarge")),
    date: dateField(t("dateRequired"), t("dateInvalid")),
    description: z.string().trim().optional(),
    categoryId: z.union([z.string().uuid(), z.literal("")]),
  });
}

export type TransactionState = { error?: string } | undefined;

export async function createTransaction(_prevState: TransactionState, formData: FormData): Promise<TransactionState> {
  const session = await auth();
  const t = await getTranslations("validation");
  if (!session?.user) {
    return { error: t("notLoggedIn") };
  }

  const transactionSchema = await buildTransactionSchema();
  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { type, amount, date, description, categoryId } = parsed.data;

  if (categoryId && !(await isUsableCategory(categoryId, session.user.id))) {
    return { error: t("invalidCategory") };
  }

  await db.insert(transactions).values({
    userId: session.user.id,
    type,
    amount: amount.toFixed(2),
    date,
    description: description || null,
    categoryId: categoryId || null,
  });

  revalidatePath("/dashboard");
}

export async function updateTransaction(_prevState: TransactionState, formData: FormData): Promise<TransactionState> {
  const session = await auth();
  const t = await getTranslations("validation");
  const tEntities = await getTranslations("entities");
  if (!session?.user) {
    return { error: t("notLoggedIn") };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: tEntities("missingTransactionId") };
  }

  const transactionSchema = await buildTransactionSchema();
  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { type, amount, date, description, categoryId } = parsed.data;

  if (categoryId && !(await isUsableCategory(categoryId, session.user.id))) {
    return { error: t("invalidCategory") };
  }

  const userId = session.user.id;
  const found = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ date: transactions.date, recurringTransactionId: transactions.recurringTransactionId })
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);
    if (!existing) return false;

    let recurringTransactionId = existing.recurringTransactionId;
    // Moving a materialized occurrence into another month must record a skip for the month it
    // left, otherwise ensureRecurringGenerated() recreates it there.
    if (recurringTransactionId && existing.date.slice(0, 7) !== date.slice(0, 7)) {
      const [oldYear, oldMonth] = existing.date.split("-").map(Number);
      await tx
        .insert(recurringTransactionSkips)
        .values({ recurringTransactionId, year: oldYear, month: oldMonth })
        .onConflictDoNothing();

      // If the target month already has this rule's occurrence, detach rather than duplicate it
      // (there's a unique index on rule + month).
      const [clash] = await tx
        .select({ id: transactions.id })
        .from(transactions)
        .where(
          and(
            eq(transactions.recurringTransactionId, recurringTransactionId),
            sql`to_char(${transactions.date}, 'YYYY-MM') = ${date.slice(0, 7)}`,
          ),
        )
        .limit(1);
      if (clash) recurringTransactionId = null;
    }

    await tx
      .update(transactions)
      .set({
        type,
        amount: amount.toFixed(2),
        date,
        description: description || null,
        categoryId: categoryId || null,
        recurringTransactionId,
      })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return true;
  });

  if (!found) {
    return { error: tEntities("transactionNotFound") };
  }

  revalidatePath("/dashboard");
  return { error: undefined };
}

export async function deleteTransaction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;
  const userId = session.user.id;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning({ recurringTransactionId: transactions.recurringTransactionId, date: transactions.date });

    // deleting a single materialized occurrence of a recurring rule must not bring it back the
    // next time this month is viewed — record it as skipped rather than letting it regenerate
    if (deleted?.recurringTransactionId) {
      const [year, month] = deleted.date.split("-").map(Number);
      await tx
        .insert(recurringTransactionSkips)
        .values({ recurringTransactionId: deleted.recurringTransactionId, year, month })
        .onConflictDoNothing();
    }
  });

  revalidatePath("/dashboard");
}
