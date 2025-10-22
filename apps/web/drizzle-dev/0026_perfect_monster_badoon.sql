ALTER TYPE "public"."canvas_edge_type" RENAME TO "canvas_edge_shape";--> statement-breakpoint
ALTER TABLE "edges" RENAME COLUMN "edge_type" TO "edge_shape";