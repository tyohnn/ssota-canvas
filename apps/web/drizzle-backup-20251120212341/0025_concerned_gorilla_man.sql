ALTER TABLE "blocks" ADD COLUMN "workspace_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "blocks" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_blocks_workspace_id" ON "blocks" USING btree ("workspace_id") WHERE deleted_at IS NULL;