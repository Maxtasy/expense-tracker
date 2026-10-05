-- remove any duplicates the old select-then-insert race may have created (keep the earliest row)
DELETE FROM "transactions" t USING (
  SELECT id, row_number() OVER (
    PARTITION BY recurring_transaction_id, date_trunc('month', "date"::timestamp)
    ORDER BY created_at, id
  ) AS rn
  FROM "transactions" WHERE recurring_transaction_id IS NOT NULL
) d WHERE t.id = d.id AND d.rn > 1;
--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_recurring_month_unique" ON "transactions" USING btree ("recurring_transaction_id",(date_trunc('month', "date"::timestamp)::date)) WHERE "transactions"."recurring_transaction_id" is not null;