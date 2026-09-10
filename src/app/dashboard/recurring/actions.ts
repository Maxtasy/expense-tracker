"use server";

import { z } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { recurringTransactions, transactions } from "@/db/schema";

async function buildRecurringSchema() {
  const t = await getTranslations("validation");
  return z
    .object({
      type: z.enum(["expense", "income"]),
      amount: z.coerce.number().positive(t("amountPositive")),
      categoryId: z.union([z.string().uuid(), z.literal("")]),
      description: z.string().trim().optional(),
      startDate: z.string().min(1, t("startDateRequired")),
      endDate: z.union([z.string().min(1), z.literal("")]),
    })
    .refine((data) => !data.endDate || data.endDate >= data.startDate, {
      message: t("endDateAfterStart"),
      path: ["endDate"],
    });
}

export type RecurringState = { error?: string } | null;

async function parseForm(formData: FormData) {
  const recurringSchema = await buildRecurringSchema();
  return recurringSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
}

export async function createRecurring(_prevState: RecurringState, formData: FormData): Promise<RecurringState> {
  const session = await auth();
  const t = await getTranslations("validation");
  if (!session?.user) {
    return { error: t("notLoggedIn") };
  }

  const parsed = await parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { type, amount, categoryId, description, startDate, endDate } = parsed.data;

  await db.insert(recurringTransactions).values({
    userId: session.user.id,
    type,
    amount: amount.toFixed(2),
    categoryId: categoryId || null,
    description: description || null,
    startDate,
    endDate: endDate || null,
  });

  revalidatePath("/dashboard/recurring");
  revalidatePath("/dashboard");
  return { error: undefined };
}

export async function updateRecurring(_prevState: RecurringState, formData: FormData): Promise<RecurringState> {
  const session = await auth();
  const t = await getTranslations("validation");
  const tEntities = await getTranslations("entities");
  if (!session?.user) {
    return { error: t("notLoggedIn") };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: tEntities("missingRecurringId") };
  }

  const parsed = await parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { type, amount, categoryId, description, startDate, endDate } = parsed.data;

  const updated = await db
    .update(recurringTransactions)
    .set({
      type,
      amount: amount.toFixed(2),
      categoryId: categoryId || null,
      description: description || null,
      startDate,
      endDate: endDate || null,
    })
    .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, session.user.id)))
    .returning({ id: recurringTransactions.id });

  if (updated.length === 0) {
    return { error: tEntities("recurringNotFound") };
  }

  revalidatePath("/dashboard/recurring");
  revalidatePath("/dashboard");
  return { error: undefined };
}

export async function deleteRecurring(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;
  const userId = session.user.id;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const today = new Date().toISOString().slice(0, 10);

  await db.transaction(async (tx) => {
    // future occurrences already materialized (e.g. by scrolling ahead) shouldn't outlive the
    // rule; past and current-day ones are kept for historical accuracy and just get detached
    // from the rule automatically via the FK's onDelete: "set null"
    await tx
      .delete(transactions)
      .where(and(eq(transactions.recurringTransactionId, id), eq(transactions.userId, userId), gt(transactions.date, today)));

    await tx.delete(recurringTransactions).where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));
  });

  revalidatePath("/dashboard/recurring");
  revalidatePath("/dashboard");
}
