-- normalize existing emails (trim + lowercase); fails loudly if two accounts only differ by case
UPDATE "users" SET "email" = lower(trim("email")) WHERE "email" IS NOT NULL AND "email" <> lower(trim("email"));
--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_name_unique" ON "categories" USING btree ("user_id",lower("name")) WHERE "categories"."user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_unique" ON "users" USING btree (lower("email"));