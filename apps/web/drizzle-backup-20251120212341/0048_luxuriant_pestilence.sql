CREATE SCHEMA "image_app_space";
--> statement-breakpoint
CREATE TYPE "image_app_space"."image_asset_type" AS ENUM('ai-generated', 'unsplash', 'user-upload');--> statement-breakpoint
CREATE TYPE "image_app_space"."image_category" AS ENUM('art', 'photo', 'illustration', 'design', 'abstract', 'nature', 'architecture', 'portrait', 'landscape', 'other');--> statement-breakpoint
CREATE TABLE "image_app_space"."image_asset_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_asset_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "image_app_space"."image_asset_usage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "image_app_space"."image_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_type" "image_app_space"."image_asset_type" NOT NULL,
	"image_url" text NOT NULL,
	"thumbnail_url" text,
	"width" integer,
	"height" integer,
	"file_size" integer,
	"mime_type" text,
	"prompt" text,
	"negative_prompt" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"title" text,
	"description" text,
	"tags" text[],
	"category" "image_app_space"."image_category",
	"created_by" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"bookmark_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"use_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "image_app_space"."image_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "image_app_space"."image_bookmarks" (
	"user_id" uuid NOT NULL,
	"image_asset_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "image_app_space"."image_bookmarks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "image_app_space"."image_likes" (
	"user_id" uuid NOT NULL,
	"image_asset_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "image_app_space"."image_likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "image_app_space"."image_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"image_asset_id" uuid NOT NULL,
	"session_id" text,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "image_app_space"."image_views" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "image_app_space"."user_follows" (
	"follower_id" uuid NOT NULL,
	"followee_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_follows_no_self_follow" CHECK ("image_app_space"."user_follows"."follower_id" != "image_app_space"."user_follows"."followee_id")
);
--> statement-breakpoint
ALTER TABLE "image_app_space"."user_follows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "image_app_space"."image_asset_usage" ADD CONSTRAINT "image_asset_usage_image_asset_id_image_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "image_app_space"."image_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_app_space"."image_asset_usage" ADD CONSTRAINT "image_asset_usage_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_app_space"."image_asset_usage" ADD CONSTRAINT "image_asset_usage_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_app_space"."image_assets" ADD CONSTRAINT "image_assets_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_app_space"."image_assets" ADD CONSTRAINT "image_assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_app_space"."image_bookmarks" ADD CONSTRAINT "image_bookmarks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_app_space"."image_bookmarks" ADD CONSTRAINT "image_bookmarks_image_asset_id_image_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "image_app_space"."image_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_app_space"."image_likes" ADD CONSTRAINT "image_likes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_app_space"."image_likes" ADD CONSTRAINT "image_likes_image_asset_id_image_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "image_app_space"."image_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_app_space"."image_views" ADD CONSTRAINT "image_views_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_app_space"."image_views" ADD CONSTRAINT "image_views_image_asset_id_image_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "image_app_space"."image_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_app_space"."user_follows" ADD CONSTRAINT "user_follows_follower_id_profiles_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_app_space"."user_follows" ADD CONSTRAINT "user_follows_followee_id_profiles_id_fk" FOREIGN KEY ("followee_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_image_asset_usage_unique" ON "image_app_space"."image_asset_usage" USING btree ("image_asset_id","block_id");--> statement-breakpoint
CREATE INDEX "idx_image_asset_usage_image" ON "image_app_space"."image_asset_usage" USING btree ("image_asset_id");--> statement-breakpoint
CREATE INDEX "idx_image_asset_usage_block" ON "image_app_space"."image_asset_usage" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "idx_image_asset_usage_page" ON "image_app_space"."image_asset_usage" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "idx_image_assets_creator" ON "image_app_space"."image_assets" USING btree ("created_by") WHERE "image_app_space"."image_assets"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "idx_image_assets_workspace" ON "image_app_space"."image_assets" USING btree ("workspace_id") WHERE "image_app_space"."image_assets"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "idx_image_assets_public" ON "image_app_space"."image_assets" USING btree ("is_public","created_at") WHERE "image_app_space"."image_assets"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "idx_image_assets_type" ON "image_app_space"."image_assets" USING btree ("asset_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_image_assets_category" ON "image_app_space"."image_assets" USING btree ("category","created_at") WHERE "image_app_space"."image_assets"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "idx_image_assets_tags" ON "image_app_space"."image_assets" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_image_bookmarks_user" ON "image_app_space"."image_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_image_bookmarks_image" ON "image_app_space"."image_bookmarks" USING btree ("image_asset_id");--> statement-breakpoint
CREATE INDEX "idx_image_likes_user" ON "image_app_space"."image_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_image_likes_image" ON "image_app_space"."image_likes" USING btree ("image_asset_id");--> statement-breakpoint
CREATE INDEX "idx_image_views_image_viewed" ON "image_app_space"."image_views" USING btree ("image_asset_id","viewed_at");--> statement-breakpoint
CREATE INDEX "idx_image_views_user_viewed" ON "image_app_space"."image_views" USING btree ("user_id","viewed_at");--> statement-breakpoint
CREATE INDEX "idx_user_follows_follower" ON "image_app_space"."user_follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "idx_user_follows_followee" ON "image_app_space"."user_follows" USING btree ("followee_id");--> statement-breakpoint
CREATE POLICY "image_asset_usage_select_policy" ON "image_app_space"."image_asset_usage" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM public.pages 
        WHERE pages.id = "image_app_space"."image_asset_usage"."page_id" 
        AND pages.created_by = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "image_asset_usage_insert_policy" ON "image_app_space"."image_asset_usage" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM public.pages 
        WHERE pages.id = "image_app_space"."image_asset_usage"."page_id" 
        AND pages.created_by = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "image_asset_usage_delete_policy" ON "image_app_space"."image_asset_usage" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM public.pages 
        WHERE pages.id = "image_app_space"."image_asset_usage"."page_id" 
        AND pages.created_by = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "image_assets_select_policy" ON "image_app_space"."image_assets" AS PERMISSIVE FOR SELECT TO "authenticated" USING (("image_app_space"."image_assets"."created_by" = auth.uid()) OR ("image_app_space"."image_assets"."is_public" = true AND "image_app_space"."image_assets"."is_deleted" = false));--> statement-breakpoint
CREATE POLICY "image_assets_insert_policy" ON "image_app_space"."image_assets" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("image_app_space"."image_assets"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "image_assets_update_policy" ON "image_app_space"."image_assets" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("image_app_space"."image_assets"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "image_assets_delete_policy" ON "image_app_space"."image_assets" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("image_app_space"."image_assets"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "image_bookmarks_select_policy" ON "image_app_space"."image_bookmarks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("image_app_space"."image_bookmarks"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "image_bookmarks_insert_policy" ON "image_app_space"."image_bookmarks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("image_app_space"."image_bookmarks"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "image_bookmarks_delete_policy" ON "image_app_space"."image_bookmarks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("image_app_space"."image_bookmarks"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "image_likes_select_policy" ON "image_app_space"."image_likes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "image_likes_insert_policy" ON "image_app_space"."image_likes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("image_app_space"."image_likes"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "image_likes_delete_policy" ON "image_app_space"."image_likes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("image_app_space"."image_likes"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "image_views_insert_policy" ON "image_app_space"."image_views" AS PERMISSIVE FOR INSERT TO "anon", "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_follows_select_policy" ON "image_app_space"."user_follows" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "user_follows_insert_policy" ON "image_app_space"."user_follows" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("image_app_space"."user_follows"."follower_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "user_follows_delete_policy" ON "image_app_space"."user_follows" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("image_app_space"."user_follows"."follower_id" = auth.uid());