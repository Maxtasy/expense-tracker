"use server";

import { z } from "zod";
import { and, eq, ilike, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";

const nameSchema = z.string().trim().min(1, "Name is required").max(50, "Name is too long");

export type CategoryState = { error?: string } | null;

export async function createCategory(_prevState: CategoryState, formData: FormData): Promise<CategoryState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const name = parsed.data;
  const userId = session.user.id;

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(or(isNull(categories.userId), eq(categories.userId, userId)), ilike(categories.name, name)))
    .limit(1);

  if (existing) {
    return { error: "A category with that name already exists" };
  }

  await db.insert(categories).values({ name, userId });

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
  return { error: undefined };
}

export async function updateCategory(_prevState: CategoryState, formData: FormData): Promise<CategoryState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing category id" };
  }

  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const name = parsed.data;
  const userId = session.user.id;

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(or(isNull(categories.userId), eq(categories.userId, userId)), ilike(categories.name, name)))
    .limit(1);

  if (existing && existing.id !== id) {
    return { error: "A category with that name already exists" };
  }

  const updated = await db
    .update(categories)
    .set({ name })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning({ id: categories.id });

  if (updated.length === 0) {
    return { error: "Category not found" };
  }

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
  return { error: undefined };
}

export async function deleteCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, session.user.id)));

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
}
