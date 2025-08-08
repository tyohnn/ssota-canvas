"use server";

import { z } from "zod";
import { createClerkDrizzleSupabaseClient } from "@/db";
import { workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

// 워크스페이스 생성 입력 스키마
const createWorkspaceSchema = z.object({
  name: z.string().min(1, "워크스페이스 이름은 필수입니다"),
  description: z.string().optional(),
  template: z.enum(["blank", "agent", "task", "workflow"]).default("blank"),
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
 * 사용자의 모든 워크스페이스를 가져옵니다
 */
export async function getUserWorkspaces(): Promise<
  WorkspaceActionResult<any[]>
> {
  try {
    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async (tx) => {
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
    console.error("Error getting user workspaces:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get workspaces",
    };
  }
}

/**
 * 새로운 워크스페이스를 생성합니다
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
        error: "인증이 필요합니다",
      };
    }

    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async (tx) => {
      const [workspace] = await tx
        .insert(workspaces)
        .values({
          name: input.name,
          description: input.description || "",
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
    console.error("Error creating workspace:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create workspace",
    };
  }
}

/**
 * 워크스페이스를 삭제합니다
 */
export async function deleteWorkspace(
  workspaceId: string
): Promise<WorkspaceActionResult<void>> {
  try {
    const db = await createClerkDrizzleSupabaseClient();
    await db.rls(async (tx) => {
      await tx.delete(workspaces).where(eq(workspaces.id, workspaceId));
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete workspace",
    };
  }
}

/**
 * 워크스페이스 정보를 업데이트합니다
 */
export async function updateWorkspace(
  workspaceId: string,
  updates: Partial<CreateWorkspaceInput>
): Promise<WorkspaceActionResult<any>> {
  try {
    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async (tx) => {
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
    console.error("Error updating workspace:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update workspace",
    };
  }
}
