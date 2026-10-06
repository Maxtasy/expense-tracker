DROP INDEX "categories_user_name_unique";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_name_unique" ON "categories" USING btree ("user_id",lower("name")) WHERE "categories"."user_id" is not null and "categories"."archived_at" is null;