'use server';

import { eq } from 'drizzle-orm';
import { createClerkDrizzleSupabaseClient } from '@/db/clerk-client';
import { organizations, workspaces } from '@/db/schema';
import { ActionResult, ok, err } from '@/lib/action-result';
import { z } from 'zod';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
};

export type OrgWorkspace = {
  id: string;
  name: string;
  organization_id: string | null;
  icon_name?: string | null;
};

export async function getUserOrganizations(): Promise<
  ActionResult<Organization[]>
> {
  try {
    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async tx => {
      return await tx
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          created_at: organizations.created_at,
          updated_at: organizations.updated_at,
        })
        .from(organizations);
    });

    return ok(result);
  } catch (error) {
    console.error('Error getting organizations:', error);
    return err(
      error instanceof Error ? error.message : 'Failed to get organizations'
    );
  }
}

export async function getOrganizationBySlug(
  slug: string
): Promise<ActionResult<Organization | null>> {
  try {
    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async tx => {
      const rows = await tx
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          created_at: organizations.created_at,
          updated_at: organizations.updated_at,
        })
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);
      return rows[0] ?? null;
    });

    return ok(result);
  } catch (error) {
    console.error('Error getting organization by slug:', error);
    return err(
      error instanceof Error ? error.message : 'Failed to get organization'
    );
  }
}

export async function getWorkspacesByOrganizationId(
  orgId: string
): Promise<ActionResult<OrgWorkspace[]>> {
  try {
    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async tx => {
      return await tx
        .select({
          id: workspaces.id,
          name: workspaces.name,
          organization_id: workspaces.organization_id,
          icon_name: workspaces.icon_name,
        })
        .from(workspaces)
        .where(eq(workspaces.organization_id, orgId));
    });

    return ok(result);
  } catch (error) {
    console.error('Error getting workspaces by organization:', error);
    return err(
      error instanceof Error
        ? error.message
        : 'Failed to get organization workspaces'
    );
  }
}

const updateWorkspaceIconSchema = z.object({
  workspaceId: z.uuid(),
  iconName: z.string().regex(/^[a-z0-9-]+$/),
});

export async function updateWorkspaceIcon(input: {
  workspaceId: string;
  iconName: string;
}): Promise<ActionResult<{ id: string; icon_name: string | null }>> {
  try {
    const parsed = updateWorkspaceIconSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async tx => {
      const [row] = await tx
        .update(workspaces)
        .set({ icon_name: parsed.iconName })
        .where(eq(workspaces.id, parsed.workspaceId))
        .returning({ id: workspaces.id, icon_name: workspaces.icon_name });
      return row;
    });
    return ok(result ?? { id: input.workspaceId, icon_name: parsed.iconName });
  } catch (error) {
    return err(
      error instanceof Error ? error.message : 'Failed to update workspace icon'
    );
  }
}
