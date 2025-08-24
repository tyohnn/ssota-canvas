ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."block_type";--> statement-breakpoint
CREATE TYPE "public"."block_type" AS ENUM('agent', 'task', 'workflow', 'artifact_template', 'checklist', 'data', 'artifact_class', 'block_definition', 'edge_definition', 'column_definition', 'start', 'end', 'condition', 'basic_text');--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DATA TYPE "public"."block_type" USING "block_type"::"public"."block_type";