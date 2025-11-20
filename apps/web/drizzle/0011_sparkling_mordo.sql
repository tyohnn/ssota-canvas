-- Migration: Update RLS policies to Layered Security Model (Minimal permissions)
-- Strategy: DROP existing policies → CREATE new simplified policies

-- ============================================================
-- 1. profiles table
-- ============================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "profiles";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "profiles";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "profiles";

CREATE POLICY "Enable insert for self" ON "profiles"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Enable update for self" ON "profiles"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Enable delete for self" ON "profiles"
AS PERMISSIVE FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);

-- ============================================================
-- 2. organizations table
-- ============================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "organizations";
DROP POLICY IF EXISTS "Enable update for users based on owner_id" ON "organizations";
DROP POLICY IF EXISTS "Enable delete for users based on owner_id" ON "organizations";

CREATE POLICY "Enable insert for owner" ON "organizations"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Enable update for owner" ON "organizations"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING ((select auth.uid()) = owner_id)
WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Enable delete for owner" ON "organizations"
AS PERMISSIVE FOR DELETE
TO authenticated
USING ((select auth.uid()) = owner_id);

-- ============================================================
-- 3. organization_members table - CRITICAL CHANGE
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all members and owners" ON "organization_members";
DROP POLICY IF EXISTS "Enable read access for organization owners" ON "organization_members";
DROP POLICY IF EXISTS "Enable read access for self" ON "organization_members";
DROP POLICY IF EXISTS "Enable insert for organization owners" ON "organization_members";
DROP POLICY IF EXISTS "Enable update for organization owners" ON "organization_members";
DROP POLICY IF EXISTS "Enable delete for organization owners" ON "organization_members";

-- SELECT: Self only (Application uses adminDb for Owner/Admin to view all members)
CREATE POLICY "Enable read access for self" ON "organization_members"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

-- INSERT: Self only (Service checks Owner/Admin permission before calling)
CREATE POLICY "Enable insert for self" ON "organization_members"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

-- UPDATE: Self only (Service checks Owner permission before calling)
CREATE POLICY "Enable update for self" ON "organization_members"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()));

-- DELETE: Self only (Service checks Owner permission before calling)
CREATE POLICY "Enable delete for self" ON "organization_members"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (user_id = (select auth.uid()));

-- ============================================================
-- 4. invitations table
-- ============================================================
DROP POLICY IF EXISTS "Enable read for inviter and invitee" ON "invitations";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "invitations";
DROP POLICY IF EXISTS "Enable insert for organization owners and admins" ON "invitations";
DROP POLICY IF EXISTS "Enable update for invitee" ON "invitations";

-- SELECT: Inviter or invitee
CREATE POLICY "Enable read for inviter and invitee" ON "invitations"
AS PERMISSIVE FOR SELECT
TO authenticated
USING ((select auth.uid()) = inviter_user_id OR (select auth.uid()) = invitee_user_id);

-- INSERT: Inviter only (Service checks if inviter is Owner/Admin before calling)
CREATE POLICY "Enable insert for inviter" ON "invitations"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = inviter_user_id);

-- UPDATE: Invitee only (for accepting/rejecting invitations)
CREATE POLICY "Enable update for invitee" ON "invitations"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING ((select auth.uid()) = invitee_user_id);

-- ============================================================
-- 5. notifications table
-- ============================================================
DROP POLICY IF EXISTS "Enable read for notification owner" ON "notifications";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "notifications";
DROP POLICY IF EXISTS "Enable update for notification owner" ON "notifications";

-- SELECT: Self only
CREATE POLICY "Enable read for self" ON "notifications"
AS PERMISSIVE FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- INSERT: Self only
CREATE POLICY "Enable insert for self" ON "notifications"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Self only (for marking notifications as read)
CREATE POLICY "Enable update for self" ON "notifications"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id);