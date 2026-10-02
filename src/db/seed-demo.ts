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

    // Recurring rules. startBack/endBack are months before the current one (endBack null = open
    // ended); the "Language course" rule has ended, so the recurring page also shows an end date.
    const ruleDefs = [
      { type: "income", category: categoryId("Salary"), amount: "3200.00", description: "Monthly salary", day: 1, startBack: 9, endBack: null },
      { type: "expense", category: categoryId("Housing"), amount: "950.00", description: "Rent", day: 1, startBack: 9, endBack: null },
      { type: "expense", category: categoryId("Transport"), amount: "40.00", description: "Bus pass", day: 3, startBack: 9, endBack: null },
      { type: "expense", category: categoryId("Utilities"), amount: "39.90", description: "Internet", day: 7, startBack: 9, endBack: null },
      { type: "expense", category: categoryId("Entertainment"), amount: "12.99", description: "Streaming subscription", day: 12, startBack: 7, endBack: null },
      { type: "expense", category: categoryId("Utilities"), amount: "19.99", description: "Phone plan", day: 15, startBack: 9, endBack: null },
      { type: "expense", category: categoryId("Other"), amount: "45.00", description: "Language course", day: 20, startBack: 8, endBack: 3 },
    ] as const;
    const insertedRules = await tx
      .insert(recurringTransactions)
      .values(
        ruleDefs.map((r) => ({
          userId,
          type: r.type,
          categoryId: r.category,
          amount: r.amount,
          description: r.description,
          startDate: isoDate(year, month - r.startBack, r.day),
          endDate: r.endBack === null ? null : isoDate(year, month - r.endBack, r.day),
        })),
      )
      .returning({ id: recurringTransactions.id, description: recurringTransactions.description });
    const ruleId = new Map(insertedRules.map((r) => [r.description, r.id]));

    // The rows those rules would have generated, linked to their rule exactly as lazy generation
    // creates them (so viewing a month later doesn't generate duplicates). Includes the current month.
    const generated: (typeof transactions.$inferInsert)[] = [];
    for (let back = 9; back >= 0; back--) {
      for (const r of ruleDefs) {
        if (back > r.startBack || (r.endBack !== null && back < r.endBack)) continue;
        generated.push({
          userId,
          type: r.type,
          categoryId: r.category,
          recurringTransactionId: ruleId.get(r.description),
          amount: r.amount,
          description: r.description,
          date: isoDate(year, month - back, r.day),
        });
      }
    }
    await tx.insert(transactions).values(generated);

    // Nine months of history so the account looks lived-in and the insights year view has data.
    // Amounts vary deterministically by month offset (no randomness, so re-runs are identical).
    // Salary, rent, bus pass and the other recurring items come from the rules above.
    const history: (typeof transactions.$inferInsert)[] = [];
    for (let back = 9; back >= 1; back--) {
      const m = month - back;
      const wobble = (n: number) => ((back * 7 + n * 3) % 9) - 4; // -4..4
      history.push(
        { userId, type: "expense", categoryId: categoryId("Food"), amount: (210 + wobble(1) * 6).toFixed(2), description: "Groceries", date: isoDate(year, m, 6) },
        { userId, type: "expense", categoryId: categoryId("Food"), amount: (95 + wobble(2) * 4).toFixed(2), description: "Groceries", date: isoDate(year, m, 18) },
        { userId, type: "expense", categoryId: categoryId("Utilities"), amount: (115 + wobble(3) * 3).toFixed(2), description: "Electricity bill", date: isoDate(year, m, 5) },
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
      { userId, type: "expense", categoryId: categoryId("Food"), amount: "45.30", description: "Grocery run", date: isoDate(year, month, 2) },
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
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
