ALTER TYPE "public"."edge_type" ADD VALUE 'accesses';--> statement-breakpoint
ALTER TYPE "public"."edge_type" ADD VALUE 'used_by';--> statement-breakpoint
ALTER TABLE "node_positions" DROP CONSTRAINT "node_positions_node_id_unique";--> statement-breakpoint
ALTER TABLE "node_positions" ADD COLUMN "context_node_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "node_positions" ADD CONSTRAINT "node_positions_context_node_id_nodes_id_fk" FOREIGN KEY ("context_node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;