-- Source Management Schema Migration
-- Creates source_type enum, sources, source_summaries, source_action_transactions tables
-- and adds blocks.source_id FK to sources.

-- Create source_type enum
DO $$ BEGIN
  CREATE TYPE source_type AS ENUM (
    'youtube',
    'pdf',
    'x',
    'thread',
    'audio',
    'link'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create sources table (public schema)
-- url_hash: plain column (server SSOT). Application computes in SourceUrl VO and sets on insert.
CREATE TABLE IF NOT EXISTS "sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "url" text NOT NULL,
  "url_hash" text NOT NULL,
  "source_type" "source_type" NOT NULL,
  "raw_content" text,
  "metadata" jsonb DEFAULT '{}',
  "content_language" text,
  "extracted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "sources_url_hash_unique" UNIQUE("url_hash")
);

CREATE INDEX IF NOT EXISTS "idx_sources_url_hash" ON "sources" USING btree ("url_hash");
CREATE INDEX IF NOT EXISTS "idx_sources_source_type" ON "sources" USING btree ("source_type");

ALTER TABLE "sources" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sources_block_direct_access" ON "sources"
  AS PERMISSIVE FOR ALL TO "authenticated"
  USING (false)
  WITH CHECK (false);

-- Create source_summaries table
CREATE TABLE IF NOT EXISTS "source_summaries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_id" uuid NOT NULL,
  "language" text NOT NULL,
  "summary" text NOT NULL,
  "keywords" text[],
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "source_summaries_source_id_language_unique" UNIQUE("source_id", "language"),
  CONSTRAINT "source_summaries_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- No separate indexes: UNIQUE(source_id, language) covers lookups by source_id and source_id+language.

ALTER TABLE "source_summaries" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "source_summaries_block_direct_access" ON "source_summaries"
  AS PERMISSIVE FOR ALL TO "authenticated"
  USING (false)
  WITH CHECK (false);

-- Create source_action_transactions table
-- UNIQUE NULLS NOT DISTINCT: PostgreSQL 15+ treats NULLs as equal for uniqueness
CREATE TABLE IF NOT EXISTS "source_action_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL,
  "source_id" uuid NOT NULL,
  "action_type" text NOT NULL,
  "language" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  CONSTRAINT "source_action_transactions_org_source_action_lang_unique" UNIQUE NULLS NOT DISTINCT ("org_id", "source_id", "action_type", "language"),
  CONSTRAINT "source_action_transactions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- No separate indexes: UNIQUE(org_id, source_id, action_type, language) covers (org_id, source_id) and full key.

ALTER TABLE "source_action_transactions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "source_action_transactions_block_direct_access" ON "source_action_transactions"
  AS PERMISSIVE FOR ALL TO "authenticated"
  USING (false)
  WITH CHECK (false);

-- Add source_id to blocks
ALTER TABLE "blocks" ADD COLUMN IF NOT EXISTS "source_id" uuid REFERENCES "sources"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_blocks_source_id" ON "blocks" USING btree ("source_id") WHERE "source_id" IS NOT NULL;
