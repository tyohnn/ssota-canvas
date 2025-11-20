-- Step 1: Drop all foreign key constraints that depend on profiles.user_id
-- This must be done BEFORE dropping the unique constraint

ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_inviter_user_id_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_invitee_user_id_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "organization_members" DROP CONSTRAINT IF EXISTS "organization_members_user_id_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT IF EXISTS "organizations_owner_id_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "page_favorites" DROP CONSTRAINT IF EXISTS "page_favorites_user_id_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "pages_created_by_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "workspace_invitations" DROP CONSTRAINT IF EXISTS "workspace_invitations_invited_user_id_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "workspace_invitations" DROP CONSTRAINT IF EXISTS "workspace_invitations_invited_by_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "workspace_members" DROP CONSTRAINT IF EXISTS "workspace_members_user_id_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "workspaces" DROP CONSTRAINT IF EXISTS "workspaces_owner_id_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "workspaces" DROP CONSTRAINT IF EXISTS "workspaces_created_by_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "blocks" DROP CONSTRAINT IF EXISTS "blocks_created_by_profiles_user_id_fk";
