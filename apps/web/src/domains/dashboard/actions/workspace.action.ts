'use server';

import { z } from 'zod';
import { createClerkDrizzleSupabaseClient } from '@/db/clerk-client';
import { workspaces } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// 워크스페이스 생성 입력 스키마
const createWorkspaceSchema = z.object({
  name: z.string().min(1, '워크스페이스 이름은 필수입니다'),
  description: z.string().optional(),
  template: z.enum(['blank', 'agent', 'task', 'workflow']).default('blank'),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

// 워크스페이스 결과 타입
export type WorkspaceActionResult<T = any> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Fetches all workspaces accessible to the authenticated user.
 *
 * @returns `{ success: true, data: Array<{ id: string; name: string; description: string | null; owner_id: string | null; metadata: any; created_at: string; updated_at: string; }>} ` on success; `{ success: false, error: string }` on failure.
 */
export async function getUserWorkspaces(): Promise<
  WorkspaceActionResult<any[]>
> {
  try {
    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async tx => {
      return await tx
        .select({
          id: workspaces.id,
          name: workspaces.name,
          description: workspaces.description,
          owner_id: workspaces.owner_id,
          metadata: workspaces.metadata,
          created_at: workspaces.created_at,
          updated_at: workspaces.updated_at,
        })
        .from(workspaces)
        .orderBy(workspaces.created_at);
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting user workspaces:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get workspaces',
    };
  }
}

/**
 * Create a new workspace for the current authenticated user.
 *
 * If the caller is not authenticated, the function returns a failure result with an authentication error.
 *
 * @param input - Fields for the new workspace (e.g., `name`, optional `description`, `template`)
 * @returns On success, `{ success: true, data }` where `data` is the created workspace record including `id`, `name`, `description`, `owner_id`, `metadata`, `created_at`, and `updated_at`. On failure, `{ success: false, error }` with a descriptive error message.
 */
export async function createWorkspace(
  input: CreateWorkspaceInput
): Promise<WorkspaceActionResult<any>> {
  try {
    // Clerk에서 사용자 ID를 가져옵니다
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: '인증이 필요합니다',
      };
    }

    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async tx => {
      const [workspace] = await tx
        .insert(workspaces)
        .values({
          name: input.name,
          description: input.description || '',
          owner_id: userId, // Clerk 사용자 ID를 명시적으로 설정
          metadata: {},
        })
        .returning({
          id: workspaces.id,
          name: workspaces.name,
          description: workspaces.description,
          owner_id: workspaces.owner_id,
          metadata: workspaces.metadata,
          created_at: workspaces.created_at,
          updated_at: workspaces.updated_at,
        });

      return workspace;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating workspace:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create workspace',
    };
  }
}

/**
 * Delete a workspace by its ID.
 *
 * @param workspaceId - The ID of the workspace to delete.
 * @returns An object with `success: true` and `data: undefined` if deletion succeeded, or `success: false` and an `error` message if it failed.
 */
export async function deleteWorkspace(
  workspaceId: string
): Promise<WorkspaceActionResult<void>> {
  try {
    const db = await createClerkDrizzleSupabaseClient();
    await db.rls(async tx => {
      await tx.delete(workspaces).where(eq(workspaces.id, workspaceId));
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete workspace',
    };
  }
}

/**
 * Retrieve a single workspace by its ID.
 *
 * @param workspaceId - The ID of the workspace to retrieve.
 * @returns The workspace's selected fields (`id`, `name`, `organization_id`, `icon_name`) if found, `null` otherwise.
 */
export async function getWorkspaceById(workspaceId: string): Promise<
  WorkspaceActionResult<{
    id: string;
    name: string;
    organization_id: string | null;
    icon_name: string | null;
  } | null>
> {
  try {
    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async tx => {
      const rows = await tx
        .select({
          id: workspaces.id,
          name: workspaces.name,
          organization_id: workspaces.organization_id,
          icon_name: workspaces.icon_name,
        })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);
      return rows[0] ?? null;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting workspace:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get workspace',
    };
  }
}

/**
 * Update a workspace's name and description by its ID.
 *
 * @param workspaceId - The ID of the workspace to update
 * @param updates - Partial workspace fields to apply (name and description are used)
 * @returns The updated workspace object containing `id`, `name`, `description`, `owner_id`, `metadata`, `created_at`, and `updated_at` on success; when the operation fails the returned value will be an error message within the `WorkspaceActionResult` failure shape
 */
export async function updateWorkspace(
  workspaceId: string,
  updates: Partial<CreateWorkspaceInput>
): Promise<WorkspaceActionResult<any>> {
  try {
    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async tx => {
      const [workspace] = await tx
        .update(workspaces)
        .set({
          name: updates.name,
          description: updates.description,
          updated_at: new Date(),
        })
        .where(eq(workspaces.id, workspaceId))
        .returning({
          id: workspaces.id,
          name: workspaces.name,
          description: workspaces.description,
          owner_id: workspaces.owner_id,
          metadata: workspaces.metadata,
          created_at: workspaces.created_at,
          updated_at: workspaces.updated_at,
        });

      return workspace;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating workspace:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update workspace',
    };
  }
}