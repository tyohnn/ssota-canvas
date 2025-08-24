CREATE TYPE "public"."cli_auth_code_status" AS ENUM('pending', 'approved', 'exchanged', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."object_type" AS ENUM('page', 'component', 'block');--> statement-breakpoint
ALTER TYPE "public"."block_type" ADD VALUE 'start';--> statement-breakpoint
ALTER TYPE "public"."block_type" ADD VALUE 'end';--> statement-breakpoint
ALTER TYPE "public"."block_type" ADD VALUE 'condition';--> statement-breakpoint
ALTER TYPE "public"."block_type" ADD VALUE 'text_block';--> statement-breakpoint
ALTER TYPE "public"."edge_type" ADD VALUE 'arrow';--> statement-breakpoint
CREATE TABLE "cli_auth_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(16) NOT NULL,
	"user_id" varchar(100),
	"workspace_id" uuid,
	"status" "cli_auth_code_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone,
	"exchanged_at" timestamp with time zone,
	"secret_id" uuid,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cli_auth_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "cli_auth_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "cli_secrets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"workspace_id" uuid NOT NULL,
	"secret_hash" varchar(255) NOT NULL,
	"label" varchar(100) DEFAULT '',
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cli_secrets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blocks" ADD COLUMN "object" "object_type";--> statement-breakpoint
CREATE POLICY "Enable read for owners" ON "cli_auth_codes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = current_setting('app.user_id', true));--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated" ON "cli_auth_codes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = current_setting('app.user_id', true));--> statement-breakpoint
CREATE POLICY "Approve code by assigning current user" ON "cli_auth_codes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (user_id IS NULL OR user_id = current_setting('app.user_id', true)) WITH CHECK (user_id = current_setting('app.user_id', true));--> statement-breakpoint
CREATE POLICY "Enable read/write for owners" ON "cli_secrets" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = current_setting('app.user_id', true)) WITH CHECK (user_id = current_setting('app.user_id', true));