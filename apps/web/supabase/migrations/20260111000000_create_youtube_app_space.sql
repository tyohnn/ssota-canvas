-- YouTube App Space Schema Migration
-- Creates youtube_app_space schema with channels and videos tables

-- Create schema
CREATE SCHEMA IF NOT EXISTS "youtube_app_space";

-- Grant permissions
GRANT USAGE ON SCHEMA "youtube_app_space" TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "youtube_app_space" TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA "youtube_app_space" TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "youtube_app_space" TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "youtube_app_space" 
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Create channels table
CREATE TABLE "youtube_app_space"."channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" text NOT NULL,
	"channel_name" text NOT NULL,
	"channel_description" text,
	"channel_thumbnail_url" text,
	"subscriber_count" integer,
	"video_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "channels_channel_id_unique" UNIQUE("channel_id")
);

-- Enable RLS on channels
ALTER TABLE "youtube_app_space"."channels" ENABLE ROW LEVEL SECURITY;

-- Create videos table
CREATE TABLE "youtube_app_space"."videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"channel_id" uuid,
	"published_at" timestamp with time zone,
	"duration_seconds" integer,
	"thumbnail_url" text,
	"thumbnail_high_url" text,
	"script" jsonb,
	"script_language" text,
	"script_extracted_at" timestamp with time zone,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "videos_slug_unique" UNIQUE("slug")
);

-- Enable RLS on videos
ALTER TABLE "youtube_app_space"."videos" ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraint
ALTER TABLE "youtube_app_space"."videos" 
	ADD CONSTRAINT "videos_channel_id_channels_id_fk" 
	FOREIGN KEY ("channel_id") 
	REFERENCES "youtube_app_space"."channels"("id") 
	ON DELETE cascade 
	ON UPDATE no action;

-- Create indexes
CREATE INDEX "idx_channels_channel_id" ON "youtube_app_space"."channels" USING btree ("channel_id");
CREATE INDEX "idx_videos_slug" ON "youtube_app_space"."videos" USING btree ("slug");
CREATE INDEX "idx_videos_channel_id" ON "youtube_app_space"."videos" USING btree ("channel_id");
CREATE INDEX "idx_videos_script" ON "youtube_app_space"."videos" USING gin ("script");

-- RLS Policies: 최후의 방어선 (Defense in Depth)
-- 모든 접근을 차단하여 서버를 통하지 않은 DB 직접 접근을 방지
-- 서버에서 권한 검증 후 admin client (RLS 우회)로만 접근 가능

-- Channels: 서버를 통하지 않은 모든 직접 접근 차단
CREATE POLICY "channels_block_direct_access" ON "youtube_app_space"."channels" 
	AS PERMISSIVE FOR ALL TO "authenticated" 
	USING (false)
	WITH CHECK (false);

-- Videos: 서버를 통하지 않은 모든 직접 접근 차단
CREATE POLICY "videos_block_direct_access" ON "youtube_app_space"."videos" 
	AS PERMISSIVE FOR ALL TO "authenticated" 
	USING (false)
	WITH CHECK (false);

-- Create action_transactions table
-- Action Transactions: YouTube 블록의 유료 액션 추적 (최소화)
-- 어떤 블록과 비디오가 어떤 액션이 있었는지만 기록
CREATE TABLE "youtube_app_space"."action_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "action_transactions_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "youtube_app_space"."videos"("id") ON DELETE cascade ON UPDATE no action
);

-- Enable RLS on action_transactions
ALTER TABLE "youtube_app_space"."action_transactions" ENABLE ROW LEVEL SECURITY;

-- Create indexes for action_transactions
CREATE INDEX "idx_action_transactions_block_id" ON "youtube_app_space"."action_transactions" USING btree ("block_id");
CREATE INDEX "idx_action_transactions_video_id" ON "youtube_app_space"."action_transactions" USING btree ("video_id");
CREATE INDEX "idx_action_transactions_action_type" ON "youtube_app_space"."action_transactions" USING btree ("action_type");

-- Action Transactions: 서버를 통하지 않은 모든 직접 접근 차단
CREATE POLICY "action_transactions_block_direct_access" ON "youtube_app_space"."action_transactions" 
	AS PERMISSIVE FOR ALL TO "authenticated" 
	USING (false)
	WITH CHECK (false);
