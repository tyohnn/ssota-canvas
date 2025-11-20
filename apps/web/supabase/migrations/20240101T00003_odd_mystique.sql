CREATE TYPE "public"."block_type" AS ENUM('basic', 'text', 'markdown', 'youtube', 'python', 'image', 'file', 'link', 'shape', 'page_mention', 'latex', 'github_pr', 'react_component');--> statement-breakpoint
ALTER TABLE "blocks" DROP CONSTRAINT "blocks_type_length";--> statement-breakpoint
DROP INDEX "idx_blocks_type";--> statement-breakpoint
ALTER TABLE "blocks" DROP COLUMN "block_type";