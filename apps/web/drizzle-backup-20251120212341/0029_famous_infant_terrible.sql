ALTER TYPE "public"."block_type" ADD VALUE 'basic' BEFORE 'text';--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DEFAULT 'text';