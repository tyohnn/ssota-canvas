-- Create chat_sessions table for AI chat multi-session management
-- Stores full UIMessage[] array as JSONB for exact restoration

CREATE TABLE IF NOT EXISTS "public"."chat_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text DEFAULT 'New Chat' NOT NULL,
  "messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chat_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "chat_sessions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS "idx_chat_sessions_workspace_user" ON "public"."chat_sessions" USING btree ("workspace_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_chat_sessions_updated_at" ON "public"."chat_sessions" USING btree ("workspace_id", "user_id", "updated_at");

-- Enable RLS
ALTER TABLE "public"."chat_sessions" ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own sessions
CREATE POLICY "chat_sessions_select_own" ON "public"."chat_sessions"
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING ("user_id" = (SELECT auth.uid()));

CREATE POLICY "chat_sessions_insert_own" ON "public"."chat_sessions"
  AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid()));

CREATE POLICY "chat_sessions_update_own" ON "public"."chat_sessions"
  AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING ("user_id" = (SELECT auth.uid()));

CREATE POLICY "chat_sessions_delete_own" ON "public"."chat_sessions"
  AS PERMISSIVE FOR DELETE
  TO authenticated
  USING ("user_id" = (SELECT auth.uid()));
