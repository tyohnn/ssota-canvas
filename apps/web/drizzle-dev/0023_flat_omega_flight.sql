CREATE TYPE "public"."alignment_type" AS ENUM('TOP', 'BOTTOM', 'LEFT', 'RIGHT', 'HORIZONTAL_CENTER', 'VERTICAL_CENTER', 'HORIZONTAL_DISTRIBUTE', 'VERTICAL_DISTRIBUTE');--> statement-breakpoint
CREATE TYPE "public"."canvas_edge_type" AS ENUM('default', 'straight', 'step', 'smoothstep', 'simplebezier');--> statement-breakpoint
CREATE TABLE "block_mounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"position_x" numeric(10, 2) DEFAULT '0' NOT NULL,
	"position_y" numeric(10, 2) DEFAULT '0' NOT NULL,
	"size_width" numeric(8, 2) DEFAULT '100' NOT NULL,
	"size_height" numeric(8, 2) DEFAULT '100' NOT NULL,
	"z_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "block_mounts_unique_page_block" UNIQUE("page_id","block_id"),
	CONSTRAINT "block_mounts_position_x_range" CHECK ("block_mounts"."position_x" >= -999999 AND "block_mounts"."position_x" <= 999999),
	CONSTRAINT "block_mounts_position_y_range" CHECK ("block_mounts"."position_y" >= -999999 AND "block_mounts"."position_y" <= 999999),
	CONSTRAINT "block_mounts_size_width_range" CHECK ("block_mounts"."size_width" >= 1 AND "block_mounts"."size_width" <= 10000),
	CONSTRAINT "block_mounts_size_height_range" CHECK ("block_mounts"."size_height" >= 1 AND "block_mounts"."size_height" <= 10000),
	CONSTRAINT "block_mounts_z_order_range" CHECK ("block_mounts"."z_order" >= 0 AND "block_mounts"."z_order" <= 2147483647)
);
--> statement-breakpoint
ALTER TABLE "block_mounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"source_block_id" uuid NOT NULL,
	"target_block_id" uuid NOT NULL,
	"edge_type" "canvas_edge_type" DEFAULT 'default' NOT NULL,
	"edge_label" text DEFAULT '',
	"edge_style_color" text DEFAULT '#000000',
	"edge_style_thickness" integer DEFAULT 2,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "edges_unique_page_source_target" UNIQUE("page_id","source_block_id","target_block_id"),
	CONSTRAINT "edges_thickness_range" CHECK ("edges"."edge_style_thickness" >= 1 AND "edges"."edge_style_thickness" <= 10)
);
--> statement-breakpoint
ALTER TABLE "edges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "viewports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"zoom_level" numeric(4, 2) DEFAULT '1.0' NOT NULL,
	"center_x" numeric(10, 2) DEFAULT '0' NOT NULL,
	"center_y" numeric(10, 2) DEFAULT '0' NOT NULL,
	"last_saved" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "viewports_unique_page_user" UNIQUE("page_id","user_id"),
	CONSTRAINT "viewports_zoom_level_range" CHECK ("viewports"."zoom_level" >= 0.1 AND "viewports"."zoom_level" <= 5.0),
	CONSTRAINT "viewports_center_x_range" CHECK ("viewports"."center_x" >= -999999 AND "viewports"."center_x" <= 999999),
	CONSTRAINT "viewports_center_y_range" CHECK ("viewports"."center_y" >= -999999 AND "viewports"."center_y" <= 999999)
);
--> statement-breakpoint
ALTER TABLE "viewports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "block_mounts" ADD CONSTRAINT "block_mounts_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewports" ADD CONSTRAINT "viewports_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewports" ADD CONSTRAINT "viewports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_block_mounts_page_id" ON "block_mounts" USING btree ("page_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_block_mounts_block_id" ON "block_mounts" USING btree ("block_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_block_mounts_page_z_order" ON "block_mounts" USING btree ("page_id","z_order") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_edges_page_id" ON "edges" USING btree ("page_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_edges_source_block_id" ON "edges" USING btree ("source_block_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_edges_target_block_id" ON "edges" USING btree ("target_block_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_viewports_page_user" ON "viewports" USING btree ("page_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_viewports_user_id" ON "viewports" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "Enable read for page creator" ON "block_mounts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = "block_mounts"."page_id" 
          AND pages.created_by = (SELECT auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "Enable insert for page creator" ON "block_mounts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = "block_mounts"."page_id" 
          AND pages.created_by = (SELECT auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "Enable update for page creator" ON "block_mounts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = "block_mounts"."page_id" 
          AND pages.created_by = (SELECT auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "Enable delete for page creator" ON "block_mounts" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = "block_mounts"."page_id" 
          AND pages.created_by = (SELECT auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "Enable read for page creator" ON "edges" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = "edges"."page_id" 
          AND pages.created_by = (SELECT auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "Enable insert for page creator" ON "edges" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = "edges"."page_id" 
          AND pages.created_by = (SELECT auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "Enable update for page creator" ON "edges" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = "edges"."page_id" 
          AND pages.created_by = (SELECT auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "Enable delete for page creator" ON "edges" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = "edges"."page_id" 
          AND pages.created_by = (SELECT auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "Enable read for own viewport" ON "viewports" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("viewports"."user_id" = (SELECT auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for own viewport" ON "viewports" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("viewports"."user_id" = (SELECT auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for own viewport" ON "viewports" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("viewports"."user_id" = (SELECT auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for own viewport" ON "viewports" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("viewports"."user_id" = (SELECT auth.uid()));