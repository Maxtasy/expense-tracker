"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { expenses } from "@/db/schema";

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  description: z.string().trim().optional(),
  categoryId: z.union([z.string().uuid(), z.literal("")]),
});

export type CreateExpenseState = { error: string } | undefined;

export async function createExpense(_prevState: CreateExpenseState, formData: FormData): Promise<CreateExpenseState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const parsed = expenseSchema.safeParse({
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { amount, date, description, categoryId } = parsed.data;

  await db.insert(expenses).values({
    userId: session.user.id,
    amount: amount.toFixed(2),
    date,
    description: description || null,
    categoryId: categoryId || null,
  });

  revalidatePath("/dashboard");
}

export type UpdateExpenseState = { error?: string } | null;

export async function updateExpense(_prevState: UpdateExpenseState, formData: FormData): Promise<UpdateExpenseState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing expense id" };
  }

  const parsed = expenseSchema.safeParse({
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { amount, date, description, categoryId } = parsed.data;

  const updated = await db
    .update(expenses)
    .set({
      amount: amount.toFixed(2),
      date,
      description: description || null,
      categoryId: categoryId || null,
    })
    .where(and(eq(expenses.id, id), eq(expenses.userId, session.user.id)))
    .returning({ id: expenses.id });

  if (updated.length === 0) {
    return { error: "Expense not found" };
  }

  revalidatePath("/dashboard");
  return { error: undefined };
}

export async function deleteExpense(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, session.user.id)));

  revalidatePath("/dashboard");
}
