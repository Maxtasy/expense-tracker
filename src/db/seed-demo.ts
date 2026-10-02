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

    const [freelance] = await tx
      .insert(categories)
      .values({ name: "Freelance", type: "income", userId })
      .returning({ id: categories.id });

    const [rent] = await tx
      .insert(recurringTransactions)
      .values({
        userId,
        type: "expense",
        categoryId: categoryId("Housing"),
        amount: "950.00",
        description: "Rent",
        startDate: isoDate(year, month - 9, 1),
        endDate: null,
      })
      .returning({ id: recurringTransactions.id });

    // Nine months of history so the account looks lived-in and the insights year view has data.
    // Amounts vary deterministically by month offset (no randomness, so re-runs are identical).
    // Rent rows are linked to the recurring rule, exactly as lazy generation would create them.
    const history: (typeof transactions.$inferInsert)[] = [];
    for (let back = 9; back >= 1; back--) {
      const m = month - back;
      const wobble = (n: number) => ((back * 7 + n * 3) % 9) - 4; // -4..4
      history.push(
        { userId, type: "income", categoryId: categoryId("Salary"), amount: "3200.00", description: "Monthly salary", date: isoDate(year, m, 1) },
        { userId, type: "expense", categoryId: categoryId("Housing"), recurringTransactionId: rent.id, amount: "950.00", description: "Rent", date: isoDate(year, m, 1) },
        { userId, type: "expense", categoryId: categoryId("Food"), amount: (210 + wobble(1) * 6).toFixed(2), description: "Groceries", date: isoDate(year, m, 6) },
        { userId, type: "expense", categoryId: categoryId("Food"), amount: (95 + wobble(2) * 4).toFixed(2), description: "Groceries", date: isoDate(year, m, 18) },
        { userId, type: "expense", categoryId: categoryId("Utilities"), amount: (115 + wobble(3) * 3).toFixed(2), description: "Electricity bill", date: isoDate(year, m, 5) },
        { userId, type: "expense", categoryId: categoryId("Transport"), amount: "40.00", description: "Bus pass", date: isoDate(year, m, 3) },
        { userId, type: "expense", categoryId: categoryId("Entertainment"), amount: (55 + wobble(4) * 5).toFixed(2), description: "Cinema and dinner", date: isoDate(year, m, 14) },
        { userId, type: "expense", categoryId: hobbies.id, amount: (30 + wobble(5) * 3).toFixed(2), description: "Board game night", date: isoDate(year, m, 21) },
      );
      if (back % 3 === 0) {
        history.push({ userId, type: "expense", categoryId: categoryId("Shopping"), amount: (80 + wobble(6) * 8).toFixed(2), description: "Clothes", date: isoDate(year, m, 12) });
      }
      if (back % 3 === 1) {
        history.push({ userId, type: "income", categoryId: freelance.id, amount: (380 + wobble(7) * 25).toFixed(2), description: "Freelance project", date: isoDate(year, m, 20) });
      }
      if (back % 4 === 0) {
        history.push({ userId, type: "income", categoryId: categoryId("Salary"), amount: "300.00", description: "Bonus", date: isoDate(year, m, 25) });
      }
    }
    await tx.insert(transactions).values(history);

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
