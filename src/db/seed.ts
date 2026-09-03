import { isNull } from "drizzle-orm";
import { db } from "./index";
import { categories } from "./schema";

const DEFAULT_CATEGORIES: { name: string; type: "expense" | "income" }[] = [
  { name: "Food", type: "expense" },
  { name: "Transport", type: "expense" },
  { name: "Housing", type: "expense" },
  { name: "Utilities", type: "expense" },
  { name: "Entertainment", type: "expense" },
  { name: "Health", type: "expense" },
  { name: "Shopping", type: "expense" },
  { name: "Other", type: "expense" },
  { name: "Salary", type: "income" },
  { name: "Parental allowance", type: "income" },
  { name: "Child benefit", type: "income" },
];

async function main() {
  const existing = await db.select({ name: categories.name }).from(categories).where(isNull(categories.userId));
  const existingNames = new Set(existing.map((c) => c.name));

  const toInsert = DEFAULT_CATEGORIES.filter((c) => !existingNames.has(c.name)).map((c) => ({ ...c, userId: null }));

  if (toInsert.length === 0) {
    console.log("Default categories already seeded, nothing to do.");
    process.exit(0);
  }

  await db.insert(categories).values(toInsert);
  console.log(`Seeded ${toInsert.length} default categories:`, toInsert.map((c) => `${c.name} (${c.type})`));
  process.exit(0);
}

main();
