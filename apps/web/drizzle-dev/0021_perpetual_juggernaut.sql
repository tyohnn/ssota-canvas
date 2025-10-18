CREATE INDEX "idx_invitations_org_status" ON "invitations" USING btree ("organization_id","status") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "idx_org_members_org_id" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_org_members_user_id" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_email" ON "profiles" USING btree ("email");