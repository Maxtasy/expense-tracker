ALTER TABLE "users" ADD COLUMN "onboarded_at" timestamp;--> statement-breakpoint
-- existing users already know the app; only accounts created from now on get the first-run tour
UPDATE "users" SET "onboarded_at" = now();
