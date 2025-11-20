ALTER TYPE "public"."block_type" ADD VALUE 'shape' BEFORE 'image';--> statement-breakpoint
ALTER TABLE "edges" DROP CONSTRAINT "edges_context_block_id_blocks_id_fk";
--> statement-breakpoint
ALTER TABLE "edges" DROP COLUMN "context_block_id";