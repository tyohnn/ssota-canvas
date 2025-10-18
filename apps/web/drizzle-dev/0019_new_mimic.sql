CREATE TABLE "workspace_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"invited_user_id" uuid NOT NULL,
	"invited_by" uuid NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"notification_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "workspace_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_user_id_profiles_user_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_profiles_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_workspace_invitations_user" ON "workspace_invitations" USING btree ("invited_user_id","status");--> statement-breakpoint
CREATE INDEX "idx_workspace_invitations_workspace" ON "workspace_invitations" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_workspace_invitations_unique_pending" ON "workspace_invitations" USING btree ("workspace_id","invited_user_id","status") WHERE status = 'pending';--> statement-breakpoint
CREATE POLICY "Enable read for invited user or inviter" ON "workspace_invitations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (invited_user_id = (select auth.uid()) OR invited_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable insert for inviter" ON "workspace_invitations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (invited_by = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable update for invited user" ON "workspace_invitations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (invited_user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "Enable delete for inviter" ON "workspace_invitations" AS PERMISSIVE FOR DELETE TO "authenticated" USING (invited_by = (select auth.uid()));