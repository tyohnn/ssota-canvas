CREATE TYPE "public"."user_type" AS ENUM('ADMIN', 'GENERAL');--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_unique_default_per_owner" UNIQUE("owner_id","is_default")
);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"marketing_data" jsonb,
	"onboarding_completed_at" timestamp,
	"user_type" "user_type" DEFAULT 'GENERAL' NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "organizations" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "organizations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable update for users based on owner_id" ON "organizations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = owner_id) WITH CHECK ((select auth.uid()) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable delete for users based on owner_id" ON "organizations" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = owner_id);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "profiles" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = user_id);--> statement-breakpoint
CREATE POLICY "Enable update for users based on user_id" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);--> statement-breakpoint
CREATE POLICY "Enable delete for users based on user_id" ON "profiles" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = user_id);