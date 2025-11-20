ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DEFAULT 'text'::text;--> statement-breakpoint
DROP TYPE "public"."block_type";--> statement-breakpoint
CREATE TYPE "public"."block_type" AS ENUM('default', 'text', 'shape', 'markdown', 'youtube', 'image', 'pdf', 'audio', 'video', 'file', 'python', 'link', 'page_mention', 'latex', 'github_pr', 'react_component');--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DEFAULT 'text'::"public"."block_type";--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DATA TYPE "public"."block_type" USING "block_type"::"public"."block_type";