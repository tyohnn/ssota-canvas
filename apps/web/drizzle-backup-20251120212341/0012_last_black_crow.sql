-- Step 1: Drop FK constraints that reference organizations.id
ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_organization_id_organizations_id_fk";--> statement-breakpoint
ALTER TABLE "organization_members" DROP CONSTRAINT IF EXISTS "organization_members_organization_id_organizations_id_fk";--> statement-breakpoint

-- Step 2: Change parent table PK type first (organizations.id: TEXT → UUID)
ALTER TABLE "organizations" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

-- Step 3: Change child table FK columns (invitations, organization_members)
ALTER TABLE "invitations" ALTER COLUMN "organization_id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "organization_id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint

-- Step 4: Change independent table column (notifications.related_id)
-- Note: related_id is nullable, so we set existing TEXT values to NULL
ALTER TABLE "notifications" ALTER COLUMN "related_id" SET DATA TYPE uuid USING NULL;--> statement-breakpoint

-- Step 5: Add new columns
ALTER TABLE "invitations" ADD COLUMN "expires_at" timestamp NOT NULL DEFAULT (NOW() + INTERVAL '7 days');--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint

-- Step 6: Recreate FK constraints
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;