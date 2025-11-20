ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_unique_default_per_org";

-- Add partial unique index (is_default=true인 경우만 조직당 1개)
-- Drizzle ORM에서 지원하지 않아 수동 추가
CREATE UNIQUE INDEX "workspaces_unique_default_per_org" 
ON "workspaces"("organization_id", "is_default") 
WHERE "is_default" = true;