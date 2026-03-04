-- X App Space: Add profiles table and profile_id to posts
-- Run when ready: supabase migration up (or apply manually)

-- Create profiles table
CREATE TABLE IF NOT EXISTS "x_app_space"."profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "username" text NOT NULL,
  "name" text,
  "profile_image_url" text,
  "description" text,
  "followers_count" integer,
  "following_count" integer,
  "tweet_count" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);

-- Enable RLS
ALTER TABLE "x_app_space"."profiles" ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX "idx_profiles_user_id" ON "x_app_space"."profiles" USING btree ("user_id");

-- RLS policy
CREATE POLICY "profiles_block_direct_access" ON "x_app_space"."profiles"
  AS PERMISSIVE FOR ALL TO "authenticated"
  USING (false)
  WITH CHECK (false);

-- Add profile_id to posts, drop author columns
ALTER TABLE "x_app_space"."posts"
  ADD COLUMN IF NOT EXISTS "profile_id" uuid REFERENCES "x_app_space"."profiles"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_posts_profile_id" ON "x_app_space"."posts" ("profile_id");

-- Migrate: Drop old author columns (run after backfill if needed)
-- ALTER TABLE "x_app_space"."posts" DROP COLUMN IF EXISTS "author_username";
-- ALTER TABLE "x_app_space"."posts" DROP COLUMN IF EXISTS "author_name";
-- ALTER TABLE "x_app_space"."posts" DROP COLUMN IF EXISTS "author_profile_image_url";
