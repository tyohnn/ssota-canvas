CREATE SCHEMA "image_app_space";
--> statement-breakpoint
CREATE TYPE "public"."alignment_type" AS ENUM('TOP', 'BOTTOM', 'LEFT', 'RIGHT', 'HORIZONTAL_CENTER', 'VERTICAL_CENTER', 'HORIZONTAL_DISTRIBUTE', 'VERTICAL_DISTRIBUTE');--> statement-breakpoint
CREATE TYPE "public"."block_type" AS ENUM('text', 'shape', 'image', 'markdown', 'link', 'youtube', 'pdf', 'audio', 'video', 'file', 'python', 'page_mention', 'latex', 'github_pr', 'react_component');--> statement-breakpoint
CREATE TYPE "public"."canvas_edge_shape" AS ENUM('default', 'straight', 'step', 'smoothstep', 'simplebezier');--> statement-breakpoint
CREATE TYPE "public"."event_action" AS ENUM('created', 'updated', 'deleted', 'duplicated', 'set', 'reset');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('user_utterance', 'ai_response', 'tool_call', 'block', 'edge', 'component', 'instance', 'property', 'property_value', 'block_action');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('invitation', 'workspace-invitation', 'system', 'announcement');--> statement-breakpoint
CREATE TYPE "public"."organization_type" AS ENUM('personal', 'education', 'startup', 'agency', 'company', 'n/a');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('text', 'url', 'email', 'phone', 'select', 'multiselect', 'status', 'datetime', 'media', 'profile');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('ADMIN', 'GENERAL');--> statement-breakpoint
CREATE TYPE "image_app_space"."image_asset_type" AS ENUM('ai-generated', 'unsplash', 'user-upload');--> statement-breakpoint
CREATE TYPE "image_app_space"."image_category" AS ENUM('art', 'photo', 'illustration', 'design', 'abstract', 'nature', 'architecture', 'portrait', 'landscape', 'other');--> statement-breakpoint
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
CREATE TABLE "blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"block_type" "block_type" DEFAULT 'text' NOT NULL,
	"title" text DEFAULT '새 블럭' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"content" jsonb,
	"content_raw" text,
	"custom_properties" jsonb DEFAULT '[]'::jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"source_block_mount_id" uuid NOT NULL,
	"target_block_mount_id" uuid NOT NULL,
	"source_handle" text,
	"target_handle" text,
	"edge_shape" "canvas_edge_shape" DEFAULT 'default' NOT NULL,
	"edge_label" text DEFAULT '',
	"edge_style_color" text DEFAULT '#9ca3af',
	"edge_style_thickness" integer DEFAULT 2,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "edges_thickness_range" CHECK ("edges"."edge_style_thickness" >= 1 AND "edges"."edge_style_thickness" <= 10)
);
--> statement-breakpoint
ALTER TABLE "edges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "event_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" "event_type" NOT NULL,
	"action" "event_action",
	"payload" jsonb DEFAULT '{}' NOT NULL,
	"search_content" text,
	"agent_execution_id" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"inviter_user_id" uuid NOT NULL,
	"invitee_email" text NOT NULL,
	"invitee_user_id" uuid,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "invitations_unique_pending_per_email" UNIQUE("organization_id","invitee_email","status")
);
--> statement-breakpoint
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"related_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_unique" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "organization_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"organization_type" "organization_type" DEFAULT 'n/a' NOT NULL,
	"owner_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_unique_default_per_owner" UNIQUE("owner_id","is_default")
);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "page_favorites" (
	"page_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"favorited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "page_favorites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"parent_id" uuid,
	"title" text NOT NULL,
	"icon" text,
	"order" integer DEFAULT 0 NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "pages_title_length" CHECK (LENGTH(TRIM("pages"."title")) BETWEEN 1 AND 200),
	CONSTRAINT "pages_depth_non_negative" CHECK ("pages"."depth" >= 0),
	CONSTRAINT "pages_depth_root_consistency" CHECK (("pages"."parent_id" IS NULL AND "pages"."depth" = 0) OR ("pages"."parent_id" IS NOT NULL AND "pages"."depth" > 0)),
	CONSTRAINT "pages_order_non_negative" CHECK ("pages"."order" >= 0)
);
--> statement-breakpoint
ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_type" "user_type" DEFAULT 'GENERAL' NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "workspace_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"invited_user_id" uuid NOT NULL,
	"invited_by" uuid NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"notification_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "workspace_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_personal" boolean DEFAULT false NOT NULL,
	"owner_id" uuid,
	"deletable" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "workspaces_name_length" CHECK (LENGTH(TRIM("workspaces"."name")) BETWEEN 1 AND 100),
	CONSTRAINT "workspaces_description_length" CHECK ("workspaces"."description" IS NULL OR LENGTH("workspaces"."description") <= 500),
	CONSTRAINT "workspaces_default_not_deletable" CHECK (NOT ("workspaces"."is_default" = true AND "workspaces"."deletable" = true)),
	CONSTRAINT "workspaces_personal_owner_required" CHECK ("workspaces"."is_personal" = false OR "workspaces"."owner_id" IS NOT NULL),
	CONSTRAINT "workspaces_default_personal_mutually_exclusive" CHECK (NOT ("workspaces"."is_default" = true AND "workspaces"."is_personal" = true))
);
--> statement-breakpoint
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "block_mounts" ADD CONSTRAINT "block_mounts_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_mounts" ADD CONSTRAINT "block_mounts_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_source_block_mount_id_block_mounts_id_fk" FOREIGN KEY ("source_block_mount_id") REFERENCES "public"."block_mounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_target_block_mount_id_block_mounts_id_fk" FOREIGN KEY ("target_block_mount_id") REFERENCES "public"."block_mounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_user_id_profiles_id_fk" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitee_user_id_profiles_id_fk" FOREIGN KEY ("invitee_user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_favorites" ADD CONSTRAINT "page_favorites_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_favorites" ADD CONSTRAINT "page_favorites_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewports" ADD CONSTRAINT "viewports_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewports" ADD CONSTRAINT "viewports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_user_id_profiles_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "idx_block_mounts_page_id" ON "block_mounts" USING btree ("page_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_block_mounts_block_id" ON "block_mounts" USING btree ("block_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_block_mounts_page_z_order" ON "block_mounts" USING btree ("page_id","z_order") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_blocks_workspace_id" ON "blocks" USING btree ("workspace_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_blocks_type" ON "blocks" USING btree ("block_type") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_blocks_created_at" ON "blocks" USING btree ("created_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_blocks_id_active" ON "blocks" USING btree ("id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_edges_page_id" ON "edges" USING btree ("page_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_edges_source_block_mount_id" ON "edges" USING btree ("source_block_mount_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_edges_target_block_mount_id" ON "edges" USING btree ("target_block_mount_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_event_logs_page_timestamp" ON "event_logs" USING btree ("page_id","timestamp") WHERE "event_logs"."page_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_event_logs_page_type" ON "event_logs" USING btree ("page_id","event_type") WHERE "event_logs"."page_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_event_logs_agent_execution" ON "event_logs" USING btree ("agent_execution_id") WHERE "event_logs"."agent_execution_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_event_logs_recent" ON "event_logs" USING btree ("page_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_event_logs_type_action" ON "event_logs" USING btree ("page_id","event_type","action") WHERE "event_logs"."action" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_invitations_org_status" ON "invitations" USING btree ("organization_id","status") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "idx_org_members_org_id" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_user_id" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_page_favorites_user_id" ON "page_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_pages_workspace_id" ON "pages" USING btree ("workspace_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_pages_parent_id" ON "pages" USING btree ("parent_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_pages_tree_query" ON "pages" USING btree ("workspace_id","depth","order") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_pages_ancestors" ON "pages" USING btree ("id","parent_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_profiles_email" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_viewports_page_user" ON "viewports" USING btree ("page_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_viewports_user_id" ON "viewports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_invitations_user" ON "workspace_invitations" USING btree ("invited_user_id","status");--> statement-breakpoint
CREATE INDEX "idx_workspace_invitations_workspace" ON "workspace_invitations" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_workspace_invitations_unique_pending" ON "workspace_invitations" USING btree ("workspace_id","invited_user_id","status") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "idx_workspace_members_user_id" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_members_workspace_id" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_workspaces_organization_id" ON "workspaces" USING btree ("organization_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_workspaces_personal" ON "workspaces" USING btree ("organization_id","is_personal") WHERE is_personal = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_workspaces_personal_owner" ON "workspaces" USING btree ("owner_id") WHERE is_personal = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_workspaces_default" ON "workspaces" USING btree ("organization_id","is_default") WHERE is_default = true;--> statement-breakpoint
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
CREATE POLICY "Enable read for authenticated users" ON "blocks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "blocks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Enable update for authenticated users" ON "blocks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Enable delete for authenticated users" ON "blocks" AS PERMISSIVE FOR DELETE TO "authenticated" USING (true);--> statement-breakpoint
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
CREATE POLICY "Enable read for page creator" ON "event_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = "event_logs"."page_id" 
          AND pages.created_by = (SELECT auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "Enable insert for page creator" ON "event_logs" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = "event_logs"."page_id" 
          AND pages.created_by = (SELECT auth.uid())
      ) AND "event_logs"."user_id" = (SELECT auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable read for inviter and invitee" ON "invitations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = inviter_user_id OR (select auth.uid()) = invitee_user_id);--> statement-breakpoint
CREATE POLICY "Enable insert for inviter" ON "invitations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = inviter_user_id);--> statement-breakpoint
CREATE POLICY "Enable update for invitee" ON "invitations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = invitee_user_id);--> statement-breakpoint
CREATE POLICY "Enable read for self" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = user_id);--> statement-breakpoint
CREATE POLICY "Enable insert for self" ON "notifications" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = user_id);--> statement-breakpoint
CREATE POLICY "Enable update for self" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = user_id);--> statement-breakpoint
CREATE POLICY "Enable read access for self" ON "organization_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for self" ON "organization_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for self" ON "organization_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for self" ON "organization_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable read access for owner" ON "organizations" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ((select auth.uid()) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable insert for owner" ON "organizations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable update for owner" ON "organizations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = owner_id) WITH CHECK ((select auth.uid()) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable delete for owner" ON "organizations" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable read for self" ON "page_favorites" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for self" ON "page_favorites" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for self" ON "page_favorites" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for self" ON "page_favorites" AS PERMISSIVE FOR DELETE TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable read for creator" ON "pages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for creator" ON "pages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for creator" ON "pages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for creator" ON "pages" AS PERMISSIVE FOR DELETE TO "authenticated" USING (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "profiles" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for self" ON "profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = id);--> statement-breakpoint
CREATE POLICY "Enable update for self" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);--> statement-breakpoint
CREATE POLICY "Enable delete for self" ON "profiles" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = id);--> statement-breakpoint
CREATE POLICY "Enable read for own viewport" ON "viewports" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("viewports"."user_id" = (SELECT auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for own viewport" ON "viewports" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("viewports"."user_id" = (SELECT auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for own viewport" ON "viewports" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("viewports"."user_id" = (SELECT auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for own viewport" ON "viewports" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("viewports"."user_id" = (SELECT auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable read for invited user or inviter" ON "workspace_invitations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (invited_user_id = (select auth.uid()) OR invited_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for inviter" ON "workspace_invitations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (invited_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for invited user" ON "workspace_invitations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (invited_user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for inviter" ON "workspace_invitations" AS PERMISSIVE FOR DELETE TO "authenticated" USING (invited_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable read for self" ON "workspace_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for self" ON "workspace_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for self" ON "workspace_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for self" ON "workspace_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable read for creator" ON "workspaces" AS PERMISSIVE FOR SELECT TO "authenticated" USING (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for creator" ON "workspaces" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for creator" ON "workspaces" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (created_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for creator" ON "workspaces" AS PERMISSIVE FOR DELETE TO "authenticated" USING (created_by = (select auth.uid()));--> statement-breakpoint
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