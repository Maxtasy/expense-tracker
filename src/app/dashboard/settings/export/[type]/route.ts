import { eq, inArray, isNull, or } from "drizzle-orm";
import { stringify } from "csv-stringify/sync";
import { auth } from "@/auth";
import { db } from "@/db";
import { guardCsvCell } from "@/lib/csv-safe";
import { categories, hiddenCategories, recurringTransactionSkips, recurringTransactions, transactions } from "@/db/schema";

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { type } = await params;

  let csv: string;

  if (type === "categories") {
    const rows = await db
      .select({ id: categories.id, name: categories.name, type: categories.type, userId: categories.userId, color: categories.color })
      .from(categories)
      .where(or(isNull(categories.userId), eq(categories.userId, userId)))
      .orderBy(categories.name);
    const hidden = new Set(
      (await db.select({ categoryId: hiddenCategories.categoryId }).from(hiddenCategories).where(eq(hiddenCategories.userId, userId))).map(
        (h) => h.categoryId,
      ),
    );
    csv = stringify(
      rows.map((r) => ({
        id: r.id,
        name: guardCsvCell(r.name),
        type: r.type,
        is_global: r.userId === null ? "true" : "false",
        color: r.color ?? "",
        is_hidden: hidden.has(r.id) ? "true" : "false",
      })),
      { header: true, columns: ["id", "name", "type", "is_global", "color", "is_hidden"] },
    );
  } else if (type === "recurring-transactions") {
    const rows = await db
      .select()
      .from(recurringTransactions)
      .where(eq(recurringTransactions.userId, userId))
      .orderBy(recurringTransactions.startDate);
    const skips = rows.length
      ? await db
          .select()
          .from(recurringTransactionSkips)
          .where(inArray(recurringTransactionSkips.recurringTransactionId, rows.map((r) => r.id)))
      : [];
    const skippedByRule = new Map<string, string[]>();
    for (const s of skips) {
      const list = skippedByRule.get(s.recurringTransactionId) ?? [];
      list.push(`${s.year}-${String(s.month).padStart(2, "0")}`);
      skippedByRule.set(s.recurringTransactionId, list);
    }
    csv = stringify(
      rows.map((r) => ({
        id: r.id,
        type: r.type,
        category_id: r.categoryId ?? "",
        amount: r.amount,
        description: guardCsvCell(r.description ?? ""),
        start_date: r.startDate,
        end_date: r.endDate ?? "",
        skipped_months: (skippedByRule.get(r.id) ?? []).sort().join(";"),
      })),
      { header: true, columns: ["id", "type", "category_id", "amount", "description", "start_date", "end_date", "skipped_months"] },
    );
  } else if (type === "transactions") {
    const rows = await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(transactions.date);
    csv = stringify(
      rows.map((r) => ({
        id: r.id,
        type: r.type,
        category_id: r.categoryId ?? "",
        recurring_transaction_id: r.recurringTransactionId ?? "",
        amount: r.amount,
        description: guardCsvCell(r.description ?? ""),
        date: r.date,
      })),
      {
        header: true,
        columns: ["id", "type", "category_id", "recurring_transaction_id", "amount", "description", "date"],
      },
    );
  } else {
    return new Response("Not found", { status: 404 });
  }

  const baseName = type === "recurring-transactions" ? "recurring_transactions" : type;
  const timestamp = formatFilenameTimestamp(new Date(), new URL(request.url).searchParams.get("tz"));
  const filename = `${timestamp}_${baseName}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function formatFilenameTimestamp(date: Date, timeZoneParam: string | null): string {
  let timeZone = "UTC";
  if (timeZoneParam) {
    try {
      new Intl.DateTimeFormat(undefined, { timeZone: timeZoneParam });
      timeZone = timeZoneParam;
    } catch {
      // invalid tz param, fall back to UTC
    }
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}_${get("hour")}-${get("minute")}`;
}
