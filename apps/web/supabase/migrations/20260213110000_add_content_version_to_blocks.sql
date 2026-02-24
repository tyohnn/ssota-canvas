-- Add content_version to blocks for ProseMirror step-based sync (optimistic locking)
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS content_version integer NOT NULL DEFAULT 0;
