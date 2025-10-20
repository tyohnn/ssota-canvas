CREATE TABLE "blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_type" text DEFAULT 'text' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "blocks_type_length" CHECK (LENGTH(TRIM("blocks"."block_type")) >= 2 AND LENGTH("blocks"."block_type") <= 50)
);
--> statement-breakpoint
ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_blocks_type" ON "blocks" USING btree ("block_type") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_blocks_created_at" ON "blocks" USING btree ("created_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_blocks_id_active" ON "blocks" USING btree ("id") WHERE deleted_at IS NULL;--> statement-breakpoint
ALTER TABLE "block_mounts" ADD CONSTRAINT "block_mounts_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_source_block_id_blocks_id_fk" FOREIGN KEY ("source_block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_target_block_id_blocks_id_fk" FOREIGN KEY ("target_block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Enable read for authenticated users" ON "blocks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "blocks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Enable update for authenticated users" ON "blocks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Enable delete for authenticated users" ON "blocks" AS PERMISSIVE FOR DELETE TO "authenticated" USING (true);