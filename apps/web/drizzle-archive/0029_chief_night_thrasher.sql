CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"image_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Enable read access for authenticated users" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT current_setting('app.user_id', true)) = user_id);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT current_setting('app.user_id', true)) = user_id);--> statement-breakpoint
CREATE POLICY "Enable update for users based on user_id" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT current_setting('app.user_id', true)) = user_id);--> statement-breakpoint
CREATE POLICY "Enable delete for users based on user_id" ON "profiles" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT current_setting('app.user_id', true)) = user_id);