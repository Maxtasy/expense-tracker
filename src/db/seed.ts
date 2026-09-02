import { isNull } from "drizzle-orm";
import { db } from "./index";
import { categories } from "./schema";

const DEFAULT_CATEGORIES = ["Food", "Transport", "Housing", "Utilities", "Entertainment", "Health", "Shopping", "Other"];

async function main() {
  const existing = await db.select({ name: categories.name }).from(categories).where(isNull(categories.userId));
  const existingNames = new Set(existing.map((c) => c.name));

  const toInsert = DEFAULT_CATEGORIES.filter((name) => !existingNames.has(name)).map((name) => ({ name, userId: null }));

  if (toInsert.length === 0) {
    console.log("Default categories already seeded, nothing to do.");
    process.exit(0);
  }

  await db.insert(categories).values(toInsert);
  console.log(`Seeded ${toInsert.length} default categories:`, toInsert.map((c) => c.name));
  process.exit(0);
}

main();
