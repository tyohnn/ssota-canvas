ALTER TABLE "edges" RENAME COLUMN "source_block_id" TO "source_block_mount_id";--> statement-breakpoint
ALTER TABLE "edges" RENAME COLUMN "target_block_id" TO "target_block_mount_id";--> statement-breakpoint
ALTER TABLE "edges" DROP CONSTRAINT "edges_unique_page_source_target";--> statement-breakpoint
ALTER TABLE "edges" DROP CONSTRAINT "edges_source_block_id_blocks_id_fk";
--> statement-breakpoint
ALTER TABLE "edges" DROP CONSTRAINT "edges_target_block_id_blocks_id_fk";
--> statement-breakpoint
DROP INDEX "idx_edges_source_block_id";--> statement-breakpoint
DROP INDEX "idx_edges_target_block_id";--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_source_block_mount_id_block_mounts_id_fk" FOREIGN KEY ("source_block_mount_id") REFERENCES "public"."block_mounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_target_block_mount_id_block_mounts_id_fk" FOREIGN KEY ("target_block_mount_id") REFERENCES "public"."block_mounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_edges_source_block_mount_id" ON "edges" USING btree ("source_block_mount_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_edges_target_block_mount_id" ON "edges" USING btree ("target_block_mount_id") WHERE deleted_at IS NULL;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_unique_page_source_target" UNIQUE("page_id","source_block_mount_id","target_block_mount_id");