CREATE TABLE "auth_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"email" text,
	"ip" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_attempts_kind_created_idx" ON "auth_attempts" USING btree ("kind","created_at");--> statement-breakpoint
CREATE INDEX "auth_attempts_email_idx" ON "auth_attempts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "auth_attempts_ip_idx" ON "auth_attempts" USING btree ("ip");