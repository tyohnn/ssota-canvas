CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"inviter_user_id" uuid NOT NULL,
	"invitee_email" text NOT NULL,
	"invitee_user_id" uuid,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	CONSTRAINT "invitations_unique_pending_per_email" UNIQUE("organization_id","invitee_email","status")
);
--> statement-breakpoint
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_unique" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "organization_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_user_id_profiles_user_id_fk" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitee_user_id_profiles_user_id_fk" FOREIGN KEY ("invitee_user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Enable read for inviter and invitee" ON "invitations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = inviter_user_id OR (select auth.uid()) = invitee_user_id);--> statement-breakpoint
CREATE POLICY "Enable insert for organization owners and admins" ON "invitations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.organization_id = organization_id 
        AND om.user_id = (select auth.uid()) 
        AND om.role IN ('owner', 'admin')
      ));--> statement-breakpoint
CREATE POLICY "Enable update for invitee" ON "invitations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = invitee_user_id);--> statement-breakpoint
CREATE POLICY "Enable read access for organization members" ON "organization_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.organization_id = organization_id 
        AND om.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "Enable insert for organization owners and admins" ON "organization_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.organization_id = organization_id 
        AND om.user_id = (select auth.uid()) 
        AND om.role IN ('owner', 'admin')
      ));--> statement-breakpoint
CREATE POLICY "Enable update for organization owners and admins" ON "organization_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.organization_id = organization_id 
        AND om.user_id = (select auth.uid()) 
        AND om.role IN ('owner', 'admin')
      ));--> statement-breakpoint
CREATE POLICY "Enable delete for organization owners and admins" ON "organization_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.organization_id = organization_id 
        AND om.user_id = (select auth.uid()) 
        AND om.role IN ('owner', 'admin')
      ));