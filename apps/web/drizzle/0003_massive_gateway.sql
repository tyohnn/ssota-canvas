ALTER TABLE "organizations" DROP CONSTRAINT "organizations_owner_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_profiles_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;