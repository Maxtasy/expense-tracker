import { eq, isNull, or } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { ImportWizard } from "./import-wizard";

export default async function ImportMoneyManagerPage() {
  const session = await auth();
  if (!session?.user) return null;
  const userId = session.user.id;
  const t = await getTranslations("settings.moneyManager");

  const existingCategories = await db
    .select({ id: categories.id, name: categories.name, type: categories.type })
    .from(categories)
    .where(or(isNull(categories.userId), eq(categories.userId, userId)))
    .orderBy(categories.name);

  return (
    <div>
      <Link href="/dashboard/settings" className="mb-3 flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
        <ChevronLeft size={14} />
        {t("backToSettings")}
      </Link>
      <h1 className="mb-1 text-sm font-semibold text-fg">{t("title")}</h1>
      <p className="mb-4 text-xs text-fg-muted">{t("description")}</p>
      <ImportWizard existingCategories={existingCategories} />
    </div>
  );
}
