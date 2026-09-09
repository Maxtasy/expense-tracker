CREATE TABLE "recurring_transaction_skips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recurring_transaction_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_transaction_skips_recurring_transaction_id_year_month_unique" UNIQUE("recurring_transaction_id","year","month")
);
--> statement-breakpoint
ALTER TABLE "recurring_transaction_skips" ADD CONSTRAINT "recurring_transaction_skips_recurring_transaction_id_recurring_transactions_id_fk" FOREIGN KEY ("recurring_transaction_id") REFERENCES "public"."recurring_transactions"("id") ON DELETE cascade ON UPDATE no action;