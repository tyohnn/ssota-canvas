CREATE TYPE "public"."event_action" AS ENUM('created', 'updated', 'deleted', 'duplicated', 'set', 'reset');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('user_utterance', 'ai_response', 'tool_call', 'block', 'edge', 'component', 'instance', 'property', 'property_value', 'block_action');--> statement-breakpoint
CREATE TABLE "event_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" "event_type" NOT NULL,
	"action" "event_action",
	"payload" jsonb DEFAULT '{}' NOT NULL,
	"search_content" text,
	"agent_execution_id" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DEFAULT 'text'::text;--> statement-breakpoint
DROP TYPE "public"."block_type";--> statement-breakpoint
CREATE TYPE "public"."block_type" AS ENUM('text', 'shape', 'image', 'markdown', 'link', 'youtube', 'pdf', 'audio', 'video', 'file', 'python', 'page_mention', 'latex', 'github_pr', 'react_component');--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DEFAULT 'text'::"public"."block_type";--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "block_type" SET DATA TYPE "public"."block_type" USING "block_type"::"public"."block_type";--> statement-breakpoint
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_event_logs_page_timestamp" ON "event_logs" USING btree ("page_id","timestamp") WHERE "event_logs"."page_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_event_logs_page_type" ON "event_logs" USING btree ("page_id","event_type") WHERE "event_logs"."page_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_event_logs_agent_execution" ON "event_logs" USING btree ("agent_execution_id") WHERE "event_logs"."agent_execution_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_event_logs_recent" ON "event_logs" USING btree ("page_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_event_logs_type_action" ON "event_logs" USING btree ("page_id","event_type","action") WHERE "event_logs"."action" IS NOT NULL;--> statement-breakpoint
CREATE POLICY "Enable read for page creator" ON "event_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = "event_logs"."page_id" 
          AND pages.created_by = (SELECT auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "Enable insert for page creator" ON "event_logs" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = "event_logs"."page_id" 
          AND pages.created_by = (SELECT auth.uid())
      ) AND "event_logs"."user_id" = (SELECT auth.uid()));