ALTER TABLE "blocks" ADD COLUMN "properties" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "blocks" ADD COLUMN "custom_properties" jsonb DEFAULT '[]'::jsonb;