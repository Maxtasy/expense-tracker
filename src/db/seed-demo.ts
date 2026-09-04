import { hash } from "bcryptjs";
import { eq, isNull } from "drizzle-orm";
import { db } from "./index";
import { categories, recurringTransactions, transactions, users } from "./schema";

// Deterministically (re)creates a standing demo account with realistic-looking sample data, so
// browser-testing and screenshots don't require creating and deleting a throwaway account each
// time. Safe to re-run: wipes and rebuilds only this one account's data.

const email = process.env.DEMO_ACCOUNT_EMAIL;
const password = process.env.DEMO_ACCOUNT_PASSWORD;

function isoDate(year: number, month: number, day: number): string {
  // Date's constructor normalizes an out-of-range month (e.g. -6) by rolling the year back.
  const d = new Date(year, month, day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function main() {
  if (!email || !password) {
    throw new Error("DEMO_ACCOUNT_EMAIL and DEMO_ACCOUNT_PASSWORD must be set in .env.local");
  }

  const passwordHash = await hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, name: "Demo" })
    .onConflictDoUpdate({ target: users.email, set: { passwordHash } })
    .returning({ id: users.id });
  const userId = user.id;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const globalCategories = await db
    .select({ id: categories.id, name: categories.name, type: categories.type })
    .from(categories)
    .where(isNull(categories.userId));
  const categoryId = (name: string) => {
    const match = globalCategories.find((c) => c.name === name);
    if (!match) throw new Error(`Expected global category "${name}" to exist — run npm run db:seed first`);
    return match.id;
  };

  await db.transaction(async (tx) => {
    await tx.delete(transactions).where(eq(transactions.userId, userId));
    await tx.delete(recurringTransactions).where(eq(recurringTransactions.userId, userId));
    await tx.delete(categories).where(eq(categories.userId, userId));

    const [hobbies] = await tx
      .insert(categories)
      .values({ name: "Hobbies", type: "expense", userId })
      .returning({ id: categories.id });

    await tx.insert(recurringTransactions).values({
      userId,
      type: "expense",
      categoryId: categoryId("Housing"),
      amount: "950.00",
      description: "Rent",
      startDate: isoDate(year, month - 6, 1),
      endDate: null,
    });

    await tx.insert(transactions).values([
      { userId, type: "income", categoryId: categoryId("Salary"), amount: "3200.00", description: "Monthly salary", date: isoDate(year, month, 1) },
      { userId, type: "expense", categoryId: categoryId("Food"), amount: "45.30", description: "Grocery run", date: isoDate(year, month, 2) },
      { userId, type: "expense", categoryId: categoryId("Transport"), amount: "40.00", description: "Bus pass", date: isoDate(year, month, 3) },
      { userId, type: "expense", categoryId: categoryId("Utilities"), amount: "120.00", description: "Electricity bill", date: isoDate(year, month, 5) },
      { userId, type: "expense", categoryId: categoryId("Food"), amount: "18.75", description: "Grocery run", date: isoDate(year, month, 8) },
      { userId, type: "expense", categoryId: hobbies.id, amount: "35.00", description: "Board game night", date: isoDate(year, month, 9) },
      { userId, type: "expense", categoryId: categoryId("Entertainment"), amount: "25.00", description: "Movie night", date: isoDate(year, month, 11) },
      { userId, type: "expense", categoryId: categoryId("Health"), amount: "22.50", description: "Gym class", date: isoDate(year, month, 13) },
      { userId, type: "expense", categoryId: categoryId("Shopping"), amount: "89.99", description: "New shoes", date: isoDate(year, month, 15) },
      { userId, type: "expense", categoryId: categoryId("Transport"), amount: "15.50", description: "Taxi ride", date: isoDate(year, month, 17) },
      { userId, type: "expense", categoryId: categoryId("Food"), amount: "62.10", description: "Grocery run", date: isoDate(year, month, 20) },
      { userId, type: "expense", categoryId: categoryId("Entertainment"), amount: "60.00", description: "Concert ticket", date: isoDate(year, month, 22) },
      { userId, type: "expense", categoryId: categoryId("Food"), amount: "27.40", description: "Grocery run", date: isoDate(year, month, 25) },
    ]);
  });

  console.log(`Demo account ready: ${email} (id ${userId})`);
  console.log("Visit /dashboard once after seeding so the recurring rent charge materializes for the current month.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
