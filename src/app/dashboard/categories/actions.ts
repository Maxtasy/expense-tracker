"use server";

import { z } from "zod";
import { and, eq, ilike, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, hiddenCategories } from "@/db/schema";

const typeSchema = z.enum(["expense", "income"]);

async function buildSchemas() {
  const t = await getTranslations("validation");
  return {
    nameSchema: z.string().trim().min(1, t("nameRequired")).max(50, t("nameTooLong")),
    colorSchema: z.union([z.string().regex(/^#[0-9a-fA-F]{6}$/, t("invalidColor")), z.literal("")]),
  };
}

export type CategoryState = { error?: string } | null;

export async function createCategory(_prevState: CategoryState, formData: FormData): Promise<CategoryState> {
  const session = await auth();
  const t = await getTranslations("validation");
  const tEntities = await getTranslations("entities");
  if (!session?.user) {
    return { error: t("notLoggedIn") };
  }

  const { nameSchema } = await buildSchemas();
  const nameParsed = nameSchema.safeParse(formData.get("name"));
  if (!nameParsed.success) {
    return { error: nameParsed.error.issues[0].message };
  }
  const typeParsed = typeSchema.safeParse(formData.get("type"));
  if (!typeParsed.success) {
    return { error: t("invalidCategoryType") };
  }
  const name = nameParsed.data;
  const type = typeParsed.data;
  const userId = session.user.id;

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(or(isNull(categories.userId), eq(categories.userId, userId)), ilike(categories.name, name)))
    .limit(1);

  if (existing) {
    return { error: tEntities("categoryExists") };
  }

  await db.insert(categories).values({ name, type, userId });

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
  return { error: undefined };
}

export async function updateCategory(_prevState: CategoryState, formData: FormData): Promise<CategoryState> {
  const session = await auth();
  const t = await getTranslations("validation");
  const tEntities = await getTranslations("entities");
  if (!session?.user) {
    return { error: t("notLoggedIn") };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: tEntities("missingCategoryId") };
  }

  const { nameSchema, colorSchema } = await buildSchemas();
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const colorParsed = colorSchema.safeParse(formData.get("color") ?? "");
  if (!colorParsed.success) {
    return { error: colorParsed.error.issues[0].message };
  }
  const name = parsed.data;
  const color = colorParsed.data || null;
  const userId = session.user.id;

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(or(isNull(categories.userId), eq(categories.userId, userId)), ilike(categories.name, name)))
    .limit(1);

  if (existing && existing.id !== id) {
    return { error: tEntities("categoryExists") };
  }

  const updated = await db
    .update(categories)
    .set({ name, color })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning({ id: categories.id });

  if (updated.length === 0) {
    return { error: tEntities("categoryNotFound") };
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

export async function hideCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const categoryId = formData.get("categoryId");
  if (typeof categoryId !== "string" || !categoryId) return;

  // only global categories can be hidden — hiding is how you "delete" a default category
  // without removing it for every other user; a personal category is deleted outright instead
  const [category] = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.id, categoryId), isNull(categories.userId)));
  if (!category) return;

  await db.insert(hiddenCategories).values({ userId: session.user.id, categoryId }).onConflictDoNothing();

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recurring");
}

export async function unhideCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const categoryId = formData.get("categoryId");
  if (typeof categoryId !== "string" || !categoryId) return;

  await db
    .delete(hiddenCategories)
    .where(and(eq(hiddenCategories.userId, session.user.id), eq(hiddenCategories.categoryId, categoryId)));

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recurring");
}
