import { eq, isNull, or } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { ImportWizard } from "./import-wizard";

export default async function ImportMoneyManagerPage() {
  const session = await auth();
  if (!session?.user) return null;
  const userId = session.user.id;

  const existingCategories = await db
    .select({ id: categories.id, name: categories.name, type: categories.type })
    .from(categories)
    .where(or(isNull(categories.userId), eq(categories.userId, userId)))
    .orderBy(categories.name);

  return (
    <div>
      <Link href="/dashboard/settings" className="mb-3 flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
        <ChevronLeft size={14} />
        Settings
      </Link>
      <h1 className="mb-1 text-sm font-semibold text-fg">Import from Money Manager</h1>
      <p className="mb-4 text-xs text-fg-muted">
        Upload a Money Manager .xlsx export. This adds to your existing categories and transactions — nothing is
        deleted or overwritten, and re-importing the same file won&apos;t create duplicates.
      </p>
      <ImportWizard existingCategories={existingCategories} />
    </div>
  );
}
