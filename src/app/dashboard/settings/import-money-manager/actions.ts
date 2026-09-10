"use server";

import { z } from "zod";
import { eq, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { parseMoneyManagerFile, type CategorySummaryEntry } from "@/lib/importers/money-manager";

export type CategorySuggestion = CategorySummaryEntry & {
  matchedCategoryId: string | null;
};

export type PreviewState = {
  error?: string;
  result?: {
    rowCount: number;
    dateRange: { min: string; max: string } | null;
    skippedNonEur: number;
    skippedInvalid: number;
    categories: CategorySuggestion[];
  };
} | null;

async function readFile(formData: FormData, chooseFileMessage: string): Promise<ArrayBuffer> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error(chooseFileMessage);
  }
  return file.arrayBuffer();
}

export async function previewMoneyManagerImport(_prevState: PreviewState, formData: FormData): Promise<PreviewState> {
  const session = await auth();
  const tValidation = await getTranslations("validation");
  if (!session?.user) return { error: tValidation("notLoggedIn") };
  const userId = session.user.id;
  const t = await getTranslations("settings.moneyManager");

  let buffer: ArrayBuffer;
  try {
    buffer = await readFile(formData, t("chooseFile"));
  } catch (err) {
    return { error: err instanceof Error ? err.message : t("couldNotReadFile") };
  }

  let parsed;
  try {
    parsed = await parseMoneyManagerFile(buffer);
  } catch (err) {
    return { error: err instanceof Error ? err.message : t("couldNotParseFile") };
  }

  if (parsed.rows.length === 0) {
    return { error: t("noImportableTransactions") };
  }

  const existing = await db
    .select({ id: categories.id, name: categories.name, type: categories.type })
    .from(categories)
    .where(or(isNull(categories.userId), eq(categories.userId, userId)));

  const categorySuggestions: CategorySuggestion[] = parsed.categorySummary.map((c) => {
    const match = existing.find((e) => e.type === c.type && e.name.toLowerCase() === c.name.toLowerCase());
    return { ...c, matchedCategoryId: match?.id ?? null };
  });

  return {
    result: {
      rowCount: parsed.rows.length,
      dateRange: parsed.dateRange,
      skippedNonEur: parsed.skippedNonEur,
      skippedInvalid: parsed.skippedInvalid,
      categories: categorySuggestions,
    },
  };
}

const mappingEntrySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["expense", "income"]),
  action: z.enum(["create", "map", "skip"]),
  targetCategoryId: z.string().uuid().optional(),
  newName: z.string().trim().min(1).max(50).optional(),
});
const mappingSchema = z.array(mappingEntrySchema);

export type CommitState = {
  error?: string;
  success?: boolean;
  imported?: number;
  skippedDuplicates?: number;
  categoriesCreated?: number;
} | null;

export async function commitMoneyManagerImport(_prevState: CommitState, formData: FormData): Promise<CommitState> {
  const session = await auth();
  const tValidation = await getTranslations("validation");
  if (!session?.user) return { error: tValidation("notLoggedIn") };
  const userId = session.user.id;
  const t = await getTranslations("settings.moneyManager");

  let buffer: ArrayBuffer;
  try {
    buffer = await readFile(formData, t("chooseFile"));
  } catch (err) {
    return { error: err instanceof Error ? err.message : t("couldNotReadFile") };
  }

  const mappingRaw = formData.get("mapping");
  if (typeof mappingRaw !== "string") return { error: t("missingCategoryMapping") };
  let mapping: z.infer<typeof mappingSchema>;
  try {
    mapping = mappingSchema.parse(JSON.parse(mappingRaw));
  } catch {
    return { error: t("invalidCategoryMapping") };
  }

  let parsed;
  try {
    parsed = await parseMoneyManagerFile(buffer);
  } catch (err) {
    return { error: err instanceof Error ? err.message : t("couldNotParseFile") };
  }
  if (parsed.rows.length === 0) {
    return { error: t("noImportableTransactions") };
  }

  const mappingByKey = new Map(mapping.map((m) => [`${m.type}:${m.name.toLowerCase()}`, m]));
  for (const c of parsed.categorySummary) {
    if (!mappingByKey.has(`${c.type}:${c.name.toLowerCase()}`)) {
      return { error: t("missingMappingDecision", { name: c.name }) };
    }
  }

  const existingCategories = await db
    .select({ id: categories.id, name: categories.name, type: categories.type })
    .from(categories)
    .where(or(isNull(categories.userId), eq(categories.userId, userId)));

  const existingTransactionRows = await db
    .select({
      date: transactions.date,
      amount: transactions.amount,
      type: transactions.type,
      categoryId: transactions.categoryId,
      description: transactions.description,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId));
  const existingSignatures = new Set(
    existingTransactionRows.map((t) => `${t.date}|${t.amount}|${t.type}|${t.categoryId ?? "none"}|${t.description ?? ""}`),
  );

  try {
    let categoriesCreated = 0;
    let imported = 0;
    let skippedDuplicates = 0;

    await db.transaction(async (tx) => {
      const categoryIdByKey = new Map<string, string | null>(); // key -> resolved category id, null = skip

      for (const [key, entry] of mappingByKey) {
        if (entry.action === "skip") {
          categoryIdByKey.set(key, null);
          continue;
        }
        if (entry.action === "map") {
          const target = existingCategories.find((c) => c.id === entry.targetCategoryId && c.type === entry.type);
          if (!target) throw new Error(t("categoryMapTargetNotFound", { name: entry.name }));
          categoryIdByKey.set(key, target.id);
          continue;
        }
        // create
        const name = (entry.newName || entry.name).trim();
        const existingMatch = existingCategories.find(
          (c) => c.type === entry.type && c.name.toLowerCase() === name.toLowerCase(),
        );
        if (existingMatch) {
          categoryIdByKey.set(key, existingMatch.id);
          continue;
        }
        const [inserted] = await tx
          .insert(categories)
          .values({ name, type: entry.type, userId })
          .returning({ id: categories.id });
        existingCategories.push({ id: inserted.id, name, type: entry.type });
        categoryIdByKey.set(key, inserted.id);
        categoriesCreated++;
      }

      const toInsert: (typeof transactions.$inferInsert)[] = [];
      for (const row of parsed.rows) {
        const categoryId = categoryIdByKey.get(`${row.type}:${row.categoryName.toLowerCase()}`);
        if (categoryId === null) continue; // category mapped to "skip"

        const signature = `${row.date}|${row.amount}|${row.type}|${categoryId ?? "none"}|${row.description ?? ""}`;
        if (existingSignatures.has(signature)) {
          skippedDuplicates++;
          continue;
        }

        toInsert.push({
          userId,
          type: row.type,
          categoryId: categoryId ?? null,
          amount: row.amount,
          description: row.description,
          date: row.date,
        });
        imported++;
      }

      const CHUNK_SIZE = 500;
      for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
        const chunk = toInsert.slice(i, i + CHUNK_SIZE);
        if (chunk.length > 0) await tx.insert(transactions).values(chunk);
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/insights");
    return { success: true, imported, skippedDuplicates, categoriesCreated };
  } catch (err) {
    return { error: err instanceof Error ? err.message : t("importFailed") };
  }
}
