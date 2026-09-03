"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { recurringTransactions } from "@/db/schema";

const recurringSchema = z
  .object({
    type: z.enum(["expense", "income"]),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    categoryId: z.union([z.string().uuid(), z.literal("")]),
    description: z.string().trim().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.union([z.string().min(1), z.literal("")]),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type RecurringState = { error?: string } | null;

function parseForm(formData: FormData) {
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
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const parsed = parseForm(formData);
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
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing recurring transaction id" };
  }

  const parsed = parseForm(formData);
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
    return { error: "Recurring transaction not found" };
  }

  revalidatePath("/dashboard/recurring");
  revalidatePath("/dashboard");
  return { error: undefined };
}

export async function deleteRecurring(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await db.delete(recurringTransactions).where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, session.user.id)));

  revalidatePath("/dashboard/recurring");
  revalidatePath("/dashboard");
}
