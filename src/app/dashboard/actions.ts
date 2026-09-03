"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { transactions } from "@/db/schema";

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

const transactionSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  description: z.string().trim().optional(),
  categoryId: z.union([z.string().uuid(), z.literal("")]),
});

export type TransactionState = { error?: string } | undefined;

export async function createTransaction(_prevState: TransactionState, formData: FormData): Promise<TransactionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

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
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing transaction id" };
  }

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

  const updated = await db
    .update(transactions)
    .set({
      type,
      amount: amount.toFixed(2),
      date,
      description: description || null,
      categoryId: categoryId || null,
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, session.user.id)))
    .returning({ id: transactions.id });

  if (updated.length === 0) {
    return { error: "Transaction not found" };
  }

  revalidatePath("/dashboard");
  return { error: undefined };
}

export async function deleteTransaction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, session.user.id)));

  revalidatePath("/dashboard");
}
