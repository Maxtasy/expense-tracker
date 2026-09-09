-- IF NOT EXISTS: this table was already applied to the shared DB under an earlier migration
-- number before a multi-branch merge renumbered it to 0005; safe/idempotent either way.
CREATE TABLE IF NOT EXISTS "hidden_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hidden_categories_user_id_category_id_unique" UNIQUE("user_id","category_id")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "hidden_categories" ADD CONSTRAINT "hidden_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "hidden_categories" ADD CONSTRAINT "hidden_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;