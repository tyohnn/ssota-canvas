-- Split chat_sessions.messages into chat_messages table
-- 1. Create chat_messages table
-- 2. Migrate existing messages
-- 3. Drop messages column from chat_sessions

-- 1. Create chat_messages table
CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL,
  "index" integer NOT NULL,
  "role" text NOT NULL,
  "parts" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chat_messages_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_chat_messages_session_index" ON "public"."chat_messages" USING btree ("session_id", "index");

-- 2. Drop messages column from chat_sessions
ALTER TABLE "public"."chat_sessions" DROP COLUMN IF EXISTS "messages";

-- 3. Enable RLS on chat_messages (access via session ownership)
ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_select_via_session" ON "public"."chat_messages"
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."chat_sessions" cs
      WHERE cs.id = session_id AND cs.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "chat_messages_insert_via_session" ON "public"."chat_messages"
  AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."chat_sessions" cs
      WHERE cs.id = session_id AND cs.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "chat_messages_update_via_session" ON "public"."chat_messages"
  AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."chat_sessions" cs
      WHERE cs.id = session_id AND cs.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "chat_messages_delete_via_session" ON "public"."chat_messages"
  AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."chat_sessions" cs
      WHERE cs.id = session_id AND cs.user_id = (SELECT auth.uid())
    )
  );
