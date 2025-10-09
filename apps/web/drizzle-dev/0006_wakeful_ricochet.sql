CREATE TYPE "public"."notification_type" AS ENUM('invitation', 'system', 'announcement');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"related_id" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Enable read for notification owner" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = user_id);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users" ON "notifications" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = user_id);--> statement-breakpoint
CREATE POLICY "Enable update for notification owner" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = user_id);