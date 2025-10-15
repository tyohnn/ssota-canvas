// apps/web/src/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository.ts

import { eq, and, isNull, desc } from 'drizzle-orm';
import { createDrizzleSupabaseClient, adminDb } from '@/db';
import { workspaces } from '@/db/schema-dev';
import type { Workspace as DBWorkspace } from '@/db/schema-dev';
import { WorkspaceRepository } from '../interfaces/workspace.repository.interface';
import { WorkspaceAggregate } from '../../../shared/aggregates/workspace.aggregate';
import { Workspace } from '../../../shared/entities/workspace.entity';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import {
  OrganizationId,
  UserId,
} from '@/domains/organization-management/shared/value-objects/ids.vo';

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
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.id, workspaceId.value),
          isNull(workspaces.deleted_at)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return this.toDomain(row);
  }

  /**
   * 조직의 모든 Workspace 조회
   *
   * ⚠️ 주의: Service Layer에서 조직 멤버십 확인 후에만 호출!
   * 정렬 순서: Default Workspace 최상단, 나머지는 생성일 순
   */
  async findByOrganizationId(orgId: OrganizationId): Promise<Workspace[]> {
    // Admin DB: Application 레벨에서 조직 멤버십 확인이 완료된 경우
    const result = await adminDb
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.organization_id, orgId.value),
          isNull(workspaces.deleted_at)
        )
      )
      .orderBy(desc(workspaces.is_default), workspaces.created_at);

    return result.map(row => this.toDomain(row));
  }

  /**
   * DB 모델 → Domain Entity 변환
   *
   * @param row - DB 조회 결과
   * @returns Workspace Entity
   */
  private toDomain(row: typeof workspaces.$inferSelect): Workspace {
    return new Workspace(
      new WorkspaceId(row.id),
      new OrganizationId(row.organization_id),
      row.name,
      row.description,
      row.icon,
      row.is_default,
      row.is_personal, // v1.2
      row.owner_id, // v1.2
      row.deletable,
      row.created_by,
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }
}
