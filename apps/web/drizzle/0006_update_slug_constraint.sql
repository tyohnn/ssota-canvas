-- Drop the existing constraint
ALTER TABLE "blocks" DROP CONSTRAINT IF EXISTS "chk_blocks_slug_format";

-- Add the new constraint that allows Korean characters
ALTER TABLE "blocks" ADD CONSTRAINT "chk_blocks_slug_format" CHECK (slug ~ '^[a-z0-9가-힣-]+$'); 