"use server";

import { z } from "zod";
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
