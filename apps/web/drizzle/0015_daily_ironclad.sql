ALTER TABLE "blocks" ALTER COLUMN "slug" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "cli_auth_codes" ALTER COLUMN "code" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "cli_auth_codes" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "cli_secrets" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "cli_secrets" ALTER COLUMN "secret_hash" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "cli_secrets" ALTER COLUMN "label" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "cli_secrets" ALTER COLUMN "label" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "slug" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "owner_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "first_name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "image_url" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "description" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "owner_id" SET DATA TYPE text;