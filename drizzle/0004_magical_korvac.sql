-- IF NOT EXISTS: this column was already applied to the shared DB under an earlier migration
-- number before a multi-branch merge renumbered it to 0004; safe/idempotent either way.
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "color" text;