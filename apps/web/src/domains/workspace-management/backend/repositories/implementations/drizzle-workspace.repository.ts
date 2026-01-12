// apps/web/src/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository.ts

import { eq, and, or, isNull, desc, exists } from 'drizzle-orm';
import { createDrizzleSupabaseClient, adminDb } from '@/db';
import {
  workspaces,
  pages,
  workspaceMembers,
  organizationMembers,
  organizations,
} from '@/db/schema';
import type { Workspace as DBWorkspace } from '@/db/schema';
import { WorkspaceRepository } from '../interfaces/workspace.repository.interface';
import { WorkspaceAggregate } from '../../../shared/aggregates/workspace.aggregate';
import { Workspace } from '../../../shared/entities/workspace.entity';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import { PageId } from '../../../shared/value-objects/page-id.vo';
import {
  OrganizationId,
  UserId,
} from '@/domains/organization-management/shared/value-objects/ids.vo';
import { UserId as UserManagementUserId } from '@/domains/user-management/shared/value-objects/ids.vo';

export class DrizzleWorkspaceRepository implements WorkspaceRepository {
  /**
   * Workspace 저장 (생성 또는 업데이트)
   *
   * ⚠️ 주의: Service Layer에서 권한 체크 완료 후에만 호출!
   * 사용 시나리오:
   * - Workspace 생성: 조직 owner 권한 확인 후
   * - Workspace 수정: 조직 admin 이상 권한 확인 후
   */
  async save(aggregate: WorkspaceAggregate): Promise<void> {
    const workspace = aggregate.workspace;

    // Check if workspace exists
    const existing = await adminDb
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspace.workspaceId.value))
      .limit(1);

    if (existing.length > 0) {
      // Update: Admin DB 사용 (Service에서 권한 확인 후)
      await adminDb
        .update(workspaces)
        .set({
          name: workspace.name,
          description: workspace.description,
          icon: workspace.icon,
          updated_at: workspace.updatedAt,
          deleted_at: workspace.deletedAt,
        })
        .where(eq(workspaces.id, workspace.workspaceId.value));
    } else {
      // Insert: Admin DB 사용 (Service에서 권한 확인 후)
      await adminDb.insert(workspaces).values({
        id: workspace.workspaceId.value,
        organization_id: workspace.organizationId.value,
        name: workspace.name,
        description: workspace.description,
        icon: workspace.icon,
        is_default: workspace.isDefault,
        is_personal: workspace.isPersonal, // v1.2
        owner_id: workspace.ownerId, // v1.2
        deletable: workspace.deletable,
        created_by: workspace.createdBy,
        created_at: workspace.createdAt,
        updated_at: workspace.updatedAt,
        deleted_at: workspace.deletedAt,
      });
    }
  }

  /**
   * Workspace 조회 (ID 기반) - Admin DB 사용
   *
   * ⚠️ 주의: Service Layer에서 권한 체크 완료 후에만 호출!
   * 사용 시나리오:
   * - 조직 멤버가 Workspace 목록 조회 시 (조직 멤버십 확인 후)
   * - Page 접근 시 Workspace 정보 조회 (Workspace 멤버십 확인 후)
   */
  async findById(workspaceId: WorkspaceId): Promise<Workspace | null> {
    // Admin DB: Application 레벨에서 권한 검증이 완료된 경우
    const result = await adminDb
      .select({ 
        workspace: workspaces,
        orgName: organizations.name 
      })
      .from(workspaces)
      .leftJoin(
        organizations,
        eq(workspaces.organization_id, organizations.id)
      )
      .where(
        and(eq(workspaces.id, workspaceId.value), isNull(workspaces.deleted_at))
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return this.toDomain(row.workspace, row.orgName ?? undefined);
  }

  /**
   * 조직의 모든 Workspace 조회
   *
   * ⚠️ 주의: Service Layer에서 조직 멤버십 확인 후에만 호출!
   * 정렬 순서: Default Workspace 최상단, 나머지는 생성일 순
   */
  /**
   * 조직의 모든 Workspace 조회
   */
  async findByOrganizationId(orgId: OrganizationId): Promise<Workspace[]> {
    const result = await adminDb
      .select({ 
        workspace: workspaces,
        orgName: organizations.name 
      })
      .from(workspaces)
      .leftJoin(
        organizations,
        eq(workspaces.organization_id, organizations.id)
      )
      .where(
        and(
          eq(workspaces.organization_id, orgId.value),
          isNull(workspaces.deleted_at)
        )
      )
      .orderBy(desc(workspaces.is_default), workspaces.created_at);

    return result.map(row => this.toDomain(row.workspace, row.orgName ?? undefined));
  }

  /**
   * 사용자가 멤버(또는 소유자)로 참여 중인 모든 Workspace 조회
   */
  async findByUserId(userId: UserId): Promise<Workspace[]> {
    const result = await adminDb
      .select({ 
        workspace: workspaces,
        orgName: organizations.name 
      })
      .from(workspaces)
      .leftJoin(
        workspaceMembers,
        eq(workspaces.id, workspaceMembers.workspace_id)
      )
      .leftJoin(
        organizations,
        eq(workspaces.organization_id, organizations.id)
      )
      .where(
        and(
          isNull(workspaces.deleted_at),
          or(
            eq(workspaceMembers.user_id, userId.value),
            eq(workspaces.owner_id, userId.value)
          )
        )
      )
      .orderBy(desc(workspaces.is_default), workspaces.created_at);

    return result.map(row => this.toDomain(row.workspace, row.orgName ?? undefined));
  }

  /**
   * DB 모델 → Domain Entity 변환
   *
   * @param row - DB 조회 결과
   * @param orgName - 조직명 (선택사항)
   * @returns Workspace Entity
   */
  private toDomain(
    row: typeof workspaces.$inferSelect,
    orgName?: string
  ): Workspace {
    return new Workspace(
      new WorkspaceId(row.id),
      new OrganizationId(row.organization_id),
      row.name,
      row.description,
      row.icon,
      row.is_default,
      row.is_personal,
      row.owner_id,
      row.deletable,
      row.created_by,
      row.created_at,
      row.updated_at,
      row.deleted_at,
      orgName
    );
  }

  /**
   * 페이지 접근 권한 확인
   * RLS 정책을 통해 사용자가 페이지에 접근할 수 있는지 확인
   */
  async checkPageAccess(
    pageId: PageId,
    userId: UserManagementUserId
  ): Promise<boolean> {
    try {
      // 1. 페이지 존재 여부 및 생성자 확인
      const pageResult = await adminDb
        .select({
          workspace_id: pages.workspace_id,
          created_by: pages.created_by,
        })
        .from(pages)
        .where(and(eq(pages.id, pageId.value), isNull(pages.deleted_at)))
        .limit(1);

      if (pageResult.length === 0) {
        return false; // 페이지가 존재하지 않음
      }

      const page = pageResult[0]!;

      // 2. 페이지 생성자 확인 (가장 우선)
      if (page.created_by === userId.value) {
        return true;
      }

      // 3. 해당 페이지가 속한 워크스페이스 확인

      const workspaceResult = await adminDb
        .select({
          id: workspaces.id,
          owner_id: workspaces.owner_id,
          is_default: workspaces.is_default,
          organization_id: workspaces.organization_id,
        })
        .from(workspaces)
        .where(
          and(
            eq(workspaces.id, page.workspace_id),
            isNull(workspaces.deleted_at)
          )
        )
        .limit(1);

      if (workspaceResult.length === 0) {
        return false; // 워크스페이스가 존재하지 않음
      }

      const workspace = workspaceResult[0]!;

      // 4. 사용자가 워크스페이스 소유자인지 확인
      if (workspace.owner_id === userId.value) {
        return true;
      }

      // 5. 워크스페이스 멤버 확인
      const workspaceMemberResult = await adminDb
        .select({ user_id: workspaceMembers.user_id })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspace_id, workspace.id),
            eq(workspaceMembers.user_id, userId.value)
          )
        )
        .limit(1);

      if (workspaceMemberResult.length > 0) {
        return true;
      }

      // 6. 기본 워크스페이스인 경우 조직 멤버 확인
      if (workspace.is_default && workspace.organization_id) {
        const orgMemberResult = await adminDb
          .select({ user_id: organizationMembers.user_id })
          .from(organizationMembers)
          .where(
            and(
              eq(
                organizationMembers.organization_id,
                workspace.organization_id
              ),
              eq(organizationMembers.user_id, userId.value)
            )
          )
          .limit(1);

        if (orgMemberResult.length > 0) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}
