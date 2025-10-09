-- Fix infinite recursion in organization_members RLS policies
-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for organization members" ON "organization_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable insert for organization owners and admins" ON "organization_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable update for organization owners and admins" ON "organization_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable delete for organization owners and admins" ON "organization_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable read access for organization owners" ON "organization_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable insert for organization owners" ON "organization_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable update for organization owners" ON "organization_members" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "Enable delete for organization owners" ON "organization_members" CASCADE;--> statement-breakpoint

-- Create new policies without recursion (references organizations table only)
CREATE POLICY "Enable read access for organization owners" ON "organization_members"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organizations o 
    WHERE o.id = organization_id 
    AND o.owner_id = auth.uid()
  )
);--> statement-breakpoint

CREATE POLICY "Enable insert for organization owners" ON "organization_members"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organizations o 
    WHERE o.id = organization_id 
    AND o.owner_id = auth.uid()
  )
);--> statement-breakpoint

CREATE POLICY "Enable update for organization owners" ON "organization_members"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organizations o 
    WHERE o.id = organization_id 
    AND o.owner_id = auth.uid()
  )
);--> statement-breakpoint

CREATE POLICY "Enable delete for organization owners" ON "organization_members"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organizations o 
    WHERE o.id = organization_id 
    AND o.owner_id = auth.uid()
  )
);