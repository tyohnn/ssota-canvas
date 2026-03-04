-- X App Space Schema Migration
-- Creates x_app_space schema with posts table

-- Create schema
CREATE SCHEMA IF NOT EXISTS "x_app_space";

-- Grant permissions
GRANT USAGE ON SCHEMA "x_app_space" TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "x_app_space" TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA "x_app_space" TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "x_app_space" TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "x_app_space"
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Create posts table
CREATE TABLE "x_app_space"."posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" text NOT NULL,
  "text" text NOT NULL,
  "author_username" text,
  "author_name" text,
  "author_profile_image_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "posted_at" timestamp with time zone,
  "like_count" integer DEFAULT 0,
  "retweet_count" integer DEFAULT 0,
  "reply_count" integer DEFAULT 0,
  "quote_count" integer DEFAULT 0,
  CONSTRAINT "posts_post_id_unique" UNIQUE("post_id")
);

-- Enable RLS on posts
ALTER TABLE "x_app_space"."posts" ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX "idx_posts_post_id" ON "x_app_space"."posts" USING btree ("post_id");

-- RLS Policies: 최후의 방어선 (Defense in Depth)
CREATE POLICY "posts_block_direct_access" ON "x_app_space"."posts"
  AS PERMISSIVE FOR ALL TO "authenticated"
  USING (false)
  WITH CHECK (false);
