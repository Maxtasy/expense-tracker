import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL_MIGRATIONS) {
  throw new Error("DATABASE_URL_MIGRATIONS is not set. Copy .env.local.example to .env.local and fill it in.");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_MIGRATIONS,
  },
});
