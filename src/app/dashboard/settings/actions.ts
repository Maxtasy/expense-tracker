"use server";

import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { parse } from "csv-parse/sync";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { categories, recurringTransactions, transactions, users } from "@/db/schema";
import { CURRENCIES } from "@/lib/currency";
import { LOCALES } from "@/lib/locale";
import { DATE_FORMATS } from "@/lib/date-format";
import { THEMES } from "@/lib/theme";
import { getClientIp } from "@/lib/client-ip";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";
import { getUserLocale } from "@/lib/locale-server";
import { issueAndSendVerificationEmail } from "@/lib/verification";

const typeSchema = z.enum(["expense", "income"]);

function buildCsvSchemas(amountMustBePositiveNumberMessage: string) {
  const amountSchema = z.string().refine((v) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) > 0, {
    message: amountMustBePositiveNumberMessage,
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

  return { categoryRowSchema, recurringRowSchema, transactionRowSchema };
}

type CsvImportTranslator = Awaited<ReturnType<typeof getTranslations<"settings.csvImport">>>;

function parseCsv(text: string, label: string, t: CsvImportTranslator): Record<string, string>[] {
  try {
    return parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  } catch {
    throw new Error(t("csvParseError", { label }));
  }
}

function checkDuplicateIds(rows: { id: string }[], label: string, t: CsvImportTranslator) {
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.id)) throw new Error(t("duplicateId", { label, id: row.id }));
    seen.add(row.id);
  }
}

export type ImportState = { error?: string; success?: boolean } | null;

export async function importData(_prevState: ImportState, formData: FormData): Promise<ImportState> {
  const session = await auth();
  const tValidation = await getTranslations("validation");
  if (!session?.user) {
    return { error: tValidation("notLoggedIn") };
  }
  const userId = session.user.id;
  const t = await getTranslations("settings.csvImport");
  const { categoryRowSchema, recurringRowSchema, transactionRowSchema } = buildCsvSchemas(
    tValidation("amountMustBePositiveNumber"),
  );

  const categoriesFile = formData.get("categoriesFile");
  const recurringFile = formData.get("recurringFile");
  const transactionsFile = formData.get("transactionsFile");
  if (!(categoriesFile instanceof File) || !(recurringFile instanceof File) || !(transactionsFile instanceof File)) {
    return { error: t("allFilesRequired") };
  }
  if (categoriesFile.size === 0 || recurringFile.size === 0 || transactionsFile.size === 0) {
    return { error: t("allFilesRequired") };
  }

  let categoryRows: z.infer<typeof categoryRowSchema>[];
  let recurringRows: z.infer<typeof recurringRowSchema>[];
  let transactionRows: z.infer<typeof transactionRowSchema>[];

  try {
    const rawCategories = parseCsv(await categoriesFile.text(), t("categoriesFileLabel"), t);
    categoryRows = rawCategories.map((row, i) => {
      const parsed = categoryRowSchema.safeParse(row);
      if (!parsed.success) throw new Error(`${t("categoriesFileLabel")} row ${i + 2}: ${parsed.error.issues[0].message}`);
      return parsed.data;
    });
    checkDuplicateIds(categoryRows, t("categoriesFileLabel"), t);

    const rawRecurring = parseCsv(await recurringFile.text(), t("recurringFileLabel"), t);
    recurringRows = rawRecurring.map((row, i) => {
      const parsed = recurringRowSchema.safeParse(row);
      if (!parsed.success) throw new Error(`${t("recurringFileLabel")} row ${i + 2}: ${parsed.error.issues[0].message}`);
      return parsed.data;
    });
    checkDuplicateIds(recurringRows, t("recurringFileLabel"), t);

    const rawTransactions = parseCsv(await transactionsFile.text(), t("transactionsFileLabel"), t);
    transactionRows = rawTransactions.map((row, i) => {
      const parsed = transactionRowSchema.safeParse(row);
      if (!parsed.success) throw new Error(`${t("transactionsFileLabel")} row ${i + 2}: ${parsed.error.issues[0].message}`);
      return parsed.data;
    });
    checkDuplicateIds(transactionRows, t("transactionsFileLabel"), t);
  } catch (err) {
    return { error: err instanceof Error ? err.message : t("importFailed") };
  }

  const categoryIds = new Set(categoryRows.map((r) => r.id));
  for (const row of recurringRows) {
    if (row.category_id && !categoryIds.has(row.category_id)) {
      return { error: t("unknownCategoryIdRecurring", { id: row.category_id }) };
    }
  }
  const recurringIds = new Set(recurringRows.map((r) => r.id));
  for (const row of transactionRows) {
    if (row.category_id && !categoryIds.has(row.category_id)) {
      return { error: t("unknownCategoryIdTransactions", { id: row.category_id }) };
    }
    if (row.recurring_transaction_id && !recurringIds.has(row.recurring_transaction_id)) {
      return { error: t("unknownRecurringId", { id: row.recurring_transaction_id }) };
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
        return { error: t("unknownGlobalCategory", { name: row.name, type: row.type }) };
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
          if (!match) throw new Error(t("globalCategoryNotFoundDuringImport", { name: row.name, type: row.type }));
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
        if (row.category_id && !categoryId) throw new Error(t("unknownCategoryIdDuringImport", { id: row.category_id }));
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
        if (row.category_id && !categoryId) throw new Error(t("unknownCategoryIdDuringImport", { id: row.category_id }));
        const recurringTransactionId = row.recurring_transaction_id
          ? recurringIdMap.get(row.recurring_transaction_id)
          : undefined;
        if (row.recurring_transaction_id && !recurringTransactionId) {
          throw new Error(t("unknownRecurringIdDuringImport", { id: row.recurring_transaction_id }));
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
    return { error: err instanceof Error ? err.message : t("importFailed") };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/recurring");
  revalidatePath("/dashboard/insights");
  return { success: true };
}

export async function updateCurrency(formData: FormData) {
  const session = await auth();
  const t = await getTranslations("settings");
  if (!session?.user) return { error: t("notSignedIn") };
  const userId = session.user.id;

  const currency = formData.get("currency");
  if (typeof currency !== "string" || !CURRENCIES.some((c) => c.code === currency)) {
    return { error: t("invalidCurrency") };
  }

  await db.update(users).set({ currency }).where(eq(users.id, userId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recurring");
  revalidatePath("/dashboard/insights");
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateLocale(formData: FormData) {
  const session = await auth();
  const t = await getTranslations("settings");
  if (!session?.user) return { error: t("notSignedIn") };
  const userId = session.user.id;

  const locale = formData.get("locale");
  if (typeof locale !== "string" || !LOCALES.some((l) => l.code === locale)) {
    return { error: t("invalidLocale") };
  }

  await db.update(users).set({ locale }).where(eq(users.id, userId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recurring");
  revalidatePath("/dashboard/insights");
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateDateFormat(formData: FormData) {
  const session = await auth();
  const t = await getTranslations("settings");
  if (!session?.user) return { error: t("notSignedIn") };

  const dateFormat = formData.get("dateFormat");
  if (typeof dateFormat !== "string" || !DATE_FORMATS.some((f) => f.code === dateFormat)) {
    return { error: t("invalidDateFormat") };
  }

  await db.update(users).set({ dateFormat }).where(eq(users.id, session.user.id));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recurring");
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateTheme(formData: FormData) {
  const session = await auth();
  const t = await getTranslations("settings");
  if (!session?.user) return { error: t("notSignedIn") };

  const theme = formData.get("theme");
  if (typeof theme !== "string" || !THEMES.some((x) => x === theme)) {
    return { error: t("invalidTheme") };
  }

  await db.update(users).set({ theme }).where(eq(users.id, session.user.id));

  // the theme is read in the root layout, so every route needs to re-render
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateRememberLastCategory(formData: FormData) {
  const session = await auth();
  const t = await getTranslations("settings");
  if (!session?.user) return { error: t("notSignedIn") };

  await db
    .update(users)
    .set({ rememberLastCategory: formData.get("rememberLastCategory") === "on" })
    .where(eq(users.id, session.user.id));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const session = await auth();
  const tSettings = await getTranslations("settings");
  if (!session?.user) return { error: tSettings("notSignedIn") };
  const userId = session.user.id;
  const t = await getTranslations("settings.changePassword");

  const changePasswordSchema = z
    .object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, t("passwordTooShort")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const [user] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.passwordHash) return { error: tSettings("notSignedIn") };

  const currentPasswordMatches = await compare(parsed.data.currentPassword, user.passwordHash);
  if (!currentPasswordMatches) {
    return { error: t("currentPasswordIncorrect") };
  }

  const passwordHash = await hash(parsed.data.newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

  return { success: true };
}

export async function startFresh() {
  const session = await auth();
  const tValidation = await getTranslations("validation");
  if (!session?.user) return { error: tValidation("notLoggedIn") };
  const userId = session.user.id;

  await db.transaction(async (tx) => {
    await tx.delete(transactions).where(eq(transactions.userId, userId));
    // recurring_transaction_skips cascade-deletes with their rule -- no separate cleanup needed
    await tx.delete(recurringTransactions).where(eq(recurringTransactions.userId, userId));
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recurring");
  revalidatePath("/dashboard/insights");
  return { success: true };
}

// Turns the signed-in guest account into a regular one in place -- same users row, so every
// transaction/category/rule stays attached with nothing to migrate.
export async function upgradeGuestAccount(formData: FormData) {
  const session = await auth();
  const tSettings = await getTranslations("settings");
  if (!session?.user) return { error: tSettings("notSignedIn") };
  const userId = session.user.id;
  const t = await getTranslations("auth.signup");

  const schema = z.object({
    email: z.string().trim().email(t("invalidEmail")),
    password: z.string().min(8, t("passwordTooShort")),
  });
  const parsed = schema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;

  const ip = await getClientIp();
  if (await isRateLimited("signup", { ip })) return { error: t("tooManyAttempts") };
  await recordAttempt("signup", { email, ip });

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: t("emailTaken") };

  const passwordHash = await hash(password, 10);
  let upgraded: { id: string }[];
  try {
    upgraded = await db
      .update(users)
      // createdAt is reset because the 7-day email-verification grace period (src/lib/verification.ts)
      // counts from it -- a guest who upgrades on day 25 would otherwise be locked out immediately.
      .set({ email, passwordHash, isGuest: false, emailVerifiedAt: null, createdAt: new Date() })
      .where(and(eq(users.id, userId), eq(users.isGuest, true)))
      .returning({ id: users.id });
  } catch {
    // lost a race with someone registering the same email between the check above and this write
    return { error: t("emailTaken") };
  }
  if (upgraded.length === 0) return { error: tSettings("notSignedIn") };

  try {
    await issueAndSendVerificationEmail(userId, email, await getUserLocale(userId));
  } catch (err) {
    // Best-effort, same as signup -- the dashboard banner has a resend button.
    console.error("Failed to send verification email:", err);
  }

  // the guest banner (layout) and this page's own sections both depend on is_guest
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// Permanently deletes the signed-in account. Every table that holds user data references users.id
// with ON DELETE CASCADE, so removing the one row removes everything. Regular accounts must
// re-enter their password (so an unattended open session can't wipe an account); guests have none.
export async function deleteAccount(formData: FormData) {
  const session = await auth();
  const tSettings = await getTranslations("settings");
  if (!session?.user) return { error: tSettings("notSignedIn") };
  const userId = session.user.id;
  const t = await getTranslations("settings.deleteAccount");

  const [user] = await db
    .select({ email: users.email, passwordHash: users.passwordHash, isGuest: users.isGuest })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return { error: tSettings("notSignedIn") };

  if (!user.isGuest) {
    const password = formData.get("password");
    const ip = await getClientIp();
    // same budget as logging in -- this is also a place to guess the password
    if (await isRateLimited("login", { email: user.email ?? undefined, ip })) {
      return { error: t("tooManyAttempts") };
    }
    if (typeof password !== "string" || !user.passwordHash || !(await compare(password, user.passwordHash))) {
      await recordAttempt("login", { email: user.email ?? undefined, ip });
      return { error: t("passwordIncorrect") };
    }
  }

  await db.delete(users).where(eq(users.id, userId));
  // clears the session cookie; throws a redirect, so nothing after this runs
  await signOut({ redirectTo: "/login?deleted=1" });
}
