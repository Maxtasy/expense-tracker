import { eq, isNull, or } from "drizzle-orm";
import { stringify } from "csv-stringify/sync";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, recurringTransactions, transactions } from "@/db/schema";

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { type } = await params;

  let csv: string;

  if (type === "categories") {
    const rows = await db
      .select({ id: categories.id, name: categories.name, type: categories.type, userId: categories.userId })
      .from(categories)
      .where(or(isNull(categories.userId), eq(categories.userId, userId)))
      .orderBy(categories.name);
    csv = stringify(
      rows.map((r) => ({ id: r.id, name: r.name, type: r.type, is_global: r.userId === null ? "true" : "false" })),
      { header: true, columns: ["id", "name", "type", "is_global"] },
    );
  } else if (type === "recurring-transactions") {
    const rows = await db
      .select()
      .from(recurringTransactions)
      .where(eq(recurringTransactions.userId, userId))
      .orderBy(recurringTransactions.startDate);
    csv = stringify(
      rows.map((r) => ({
        id: r.id,
        type: r.type,
        category_id: r.categoryId ?? "",
        amount: r.amount,
        description: r.description ?? "",
        start_date: r.startDate,
        end_date: r.endDate ?? "",
      })),
      { header: true, columns: ["id", "type", "category_id", "amount", "description", "start_date", "end_date"] },
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
        description: r.description ?? "",
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

  const filename = type === "recurring-transactions" ? "recurring_transactions.csv" : `${type}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
