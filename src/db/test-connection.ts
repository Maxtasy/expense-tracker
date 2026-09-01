import { sql } from "drizzle-orm";
import { db } from "./index";

async function main() {
  const result = await db.execute(sql`select 1 as ok`);
  console.log("DB connection OK:", result);
  process.exit(0);
}

main();
