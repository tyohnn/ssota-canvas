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

/**
 * Retrieve all organizations accessible to the current user.
 *
 * Each organization includes `id`, `name`, `slug`, `created_at`, and `updated_at`.
 *
 * @returns An ActionResult containing an array of organizations with fields `id`, `name`, `slug`, `created_at`, and `updated_at` on success; otherwise an error message.
 */
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

/**
 * Fetches an organization by its slug.
 *
 * @param slug - The unique slug identifier of the organization to retrieve
 * @returns An ActionResult containing the matching organization record, or `null` if no organization has the provided slug
 */
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

/**
 * Fetches all workspaces that belong to the specified organization.
 *
 * @param orgId - The organization ID (UUID) used to filter workspaces
 * @returns An ActionResult whose `ok` case contains an array of `OrgWorkspace` for the organization, or whose `err` case contains an error message
 */
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

/**
 * Update a workspace's icon name.
 *
 * Validates the provided input and updates the workspace's `icon_name` in the database.
 * If the update does not return a row, returns an object using the provided `workspaceId`
 * and `iconName` as a fallback.
 *
 * @param input - Object containing update parameters
 * @param input.workspaceId - The UUID of the workspace to update
 * @param input.iconName - The new icon name (must match /^[a-z0-9-]+$/)
 * @returns An ActionResult with the updated workspace `{ id, icon_name }` on success; an error message on failure.
 */
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