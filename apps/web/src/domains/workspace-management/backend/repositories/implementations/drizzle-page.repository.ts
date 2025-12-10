// apps/web/src/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository.ts

import { eq, and, isNull, sql, desc, ilike } from 'drizzle-orm';
import { adminDb } from '@/db';
import { pages, workspaces } from '@/db/schema';
import { PageRepository } from '../interfaces/page.repository.interface';
import { PageAggregate } from '../../../shared/aggregates/page.aggregate';
import { Page } from '../../../shared/entities/page.entity';
import { PageId } from '../../../shared/value-objects/page-id.vo';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';

export class DrizzlePageRepository implements PageRepository {
  /**
   * Page 저장 (생성 또는 업데이트)
   *
   * ⚠️ 주의: Service Layer에서 권한 체크 완료 후에만 호출!
   * 사용 시나리오:
   * - Page 생성: Workspace 멤버십 확인 후
   * - Page 수정: Workspace 멤버십 확인 후
   */
  async save(aggregate: PageAggregate): Promise<void> {
    const page = aggregate.page;

    // Check if page exists
    const existing = await adminDb
      .select()
      .from(pages)
      .where(eq(pages.id, page.pageId.value))
      .limit(1);

    if (existing.length > 0) {
      // Update: Admin DB 사용 (Service에서 권한 확인 후)
      await adminDb
        .update(pages)
        .set({
          title: page.title,
          icon: page.icon,
          parent_id: page.parentId?.value || null,
          order: page.order,
          depth: page.depth,
          updated_at: page.updatedAt,
          deleted_at: page.deletedAt,
        })
        .where(eq(pages.id, page.pageId.value));
    } else {
      // Insert: Admin DB 사용 (Service에서 권한 확인 후)
      await adminDb.insert(pages).values({
        id: page.pageId.value,
        workspace_id: page.workspaceId.value,
        parent_id: page.parentId?.value || null,
        title: page.title,
        icon: page.icon,
        order: page.order,
        depth: page.depth,
        created_by: page.createdBy,
        created_at: page.createdAt,
        updated_at: page.updatedAt,
        deleted_at: page.deletedAt,
      });
    }
  }

  /**
   * Page 조회 (ID 기반) - Admin DB 사용
   *
   * ⚠️ 주의: Service Layer에서 권한 체크 완료 후에만 호출!
   * 사용 시나리오:
   * - 페이지 접근 시 (Workspace 멤버십 확인 후)
   * - 부모 페이지 조회 (depth 계산용)
   */
  async findById(pageId: PageId): Promise<Page | null> {
    // Admin DB: Application 레벨에서 권한 검증이 완료된 경우
    const result = await adminDb
      .select()
      .from(pages)
      .where(and(eq(pages.id, pageId.value), isNull(pages.deleted_at)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return this.toDomain(row);
  }

  /**
   * Workspace의 모든 페이지를 트리 구조로 조회 (재귀 CTE 사용!)
   *
   * ⚠️ 주의: Service Layer에서 Workspace 멤버십 확인 후에만 호출!
   * 정렬 순서: depth → order (계층 구조 유지)
   *
   * @param workspaceId - Workspace ID
   * @returns Page Entity 배열 (depth 순서)
   */
  async findTreeByWorkspaceId(workspaceId: WorkspaceId): Promise<Page[]> {
    // Admin DB: Application 레벨에서 Workspace 멤버십 확인이 완료된 경우
    // PostgreSQL 재귀 CTE 사용 (성능 최적화)
    const result = await adminDb.execute<typeof pages.$inferSelect>(sql`
      WITH RECURSIVE page_tree AS (
        -- Anchor: 최상위 페이지 (parent_id IS NULL)
        SELECT 
          id, workspace_id, parent_id, title, icon, "order", depth,
          created_by, created_at, updated_at, deleted_at
        FROM pages 
        WHERE workspace_id = ${workspaceId.value}
          AND parent_id IS NULL 
          AND deleted_at IS NULL
        
        UNION ALL
        
        -- Recursive: 하위 페이지
        SELECT 
          p.id, p.workspace_id, p.parent_id, p.title, p.icon, p."order", p.depth,
          p.created_by, p.created_at, p.updated_at, p.deleted_at
        FROM pages p
        INNER JOIN page_tree pt ON p.parent_id = pt.id
        WHERE p.deleted_at IS NULL
      )
      SELECT * FROM page_tree 
      ORDER BY depth, "order";
    `);

    return result.map(row => this.toDomain(row));
  }

  /**
   * 페이지의 모든 조상 조회 (재귀 CTE 사용!)
   *
   * 사용 시나리오:
   * - Page 이동 시 순환 참조 체크
   * - Breadcrumb 경로 표시
   *
   * @param pageId - Page ID
   * @returns 조상 Page 배열 (자신 포함, depth 내림차순)
   */
  async findAncestors(pageId: PageId): Promise<Page[]> {
    // Admin DB 사용
    // PostgreSQL 재귀 CTE로 ancestors 조회
    const result = await adminDb.execute<typeof pages.$inferSelect>(sql`
      WITH RECURSIVE ancestors AS (
        -- Anchor: 현재 페이지
        SELECT 
          id, workspace_id, parent_id, title, icon, "order", depth,
          created_by, created_at, updated_at, deleted_at
        FROM pages 
        WHERE id = ${pageId.value}
        
        UNION ALL
        
        -- Recursive: 부모 페이지
        SELECT 
          p.id, p.workspace_id, p.parent_id, p.title, p.icon, p."order", p.depth,
          p.created_by, p.created_at, p.updated_at, p.deleted_at
        FROM pages p
        INNER JOIN ancestors a ON p.id = a.parent_id
      )
      SELECT * FROM ancestors 
      ORDER BY depth DESC;
    `);

    return result.map(row => this.toDomain(row));
  }

  /**
   * Page의 depth 업데이트
   *
   * @param pageId - Page ID
   * @param newDepth - 새 depth 값
   */
  async updateDepth(pageId: PageId, newDepth: number): Promise<void> {
    await adminDb
      .update(pages)
      .set({
        depth: newDepth,
        updated_at: new Date(),
      })
      .where(eq(pages.id, pageId.value));
  }

  /**
   * 하위 페이지들의 depth 재귀적으로 업데이트 (재귀 CTE 사용!)
   *
   * Page 이동 시 모든 하위 페이지의 depth를 조정
   *
   * @param parentId - 부모 Page ID
   * @param depthDelta - depth 증감량 (예: +1, -2)
   */
  async updateChildrenDepth(
    parentId: PageId,
    depthDelta: number
  ): Promise<void> {
    // PostgreSQL 재귀 CTE로 모든 하위 페이지 업데이트
    await adminDb.execute(sql`
      WITH RECURSIVE children AS (
        -- Anchor: 직접 자식
        SELECT id, depth
        FROM pages 
        WHERE parent_id = ${parentId.value}
        
        UNION ALL
        
        -- Recursive: 하위 자식
        SELECT p.id, p.depth
        FROM pages p
        INNER JOIN children c ON p.parent_id = c.id
      )
      UPDATE pages
      SET depth = depth + ${depthDelta}, 
          updated_at = NOW()
      WHERE id IN (SELECT id FROM children);
    `);
  }

  /**
   * Workspace의 최근 업데이트된 페이지 조회 (경량화)
   *
   * @param workspaceId - Workspace ID
   * @param limit - 최대 조회 개수
   * @returns updated_at DESC 정렬된 페이지 배열과 workspace name
   */
  async findRecentByWorkspaceId(
    workspaceId: WorkspaceId,
    limit: number
  ): Promise<Array<{ page: Page; workspaceName: string }>> {
    const results = await adminDb
      .select({
        id: pages.id,
        workspace_id: pages.workspace_id,
        parent_id: pages.parent_id,
        title: pages.title,
        icon: pages.icon,
        order: pages.order,
        depth: pages.depth,
        created_by: pages.created_by,
        created_at: pages.created_at,
        updated_at: pages.updated_at,
        deleted_at: pages.deleted_at,
        workspace_name: workspaces.name,
      })
      .from(pages)
      .leftJoin(workspaces, eq(pages.workspace_id, workspaces.id))
      .where(
        and(eq(pages.workspace_id, workspaceId.value), isNull(pages.deleted_at))
      )
      .orderBy(desc(pages.updated_at))
      .limit(limit);

    return results.map(row => ({
      page: this.toDomain(row),
      workspaceName: row.workspace_name || 'Unknown Workspace',
    }));
  }

  /**
   * 워크스페이스 내 페이지 검색 (제목 기준)
   *
   * @param workspaceId - Workspace ID
   * @param query - 검색어
   * @param limit - 최대 조회 개수
   * @returns updated_at DESC 정렬된 페이지 배열과 workspace name
   */
  async searchByWorkspaceId(
    workspaceId: WorkspaceId,
    query: string,
    limit: number
  ): Promise<Array<{ page: Page; workspaceName: string }>> {
    const results = await adminDb
      .select({
        id: pages.id,
        workspace_id: pages.workspace_id,
        parent_id: pages.parent_id,
        title: pages.title,
        icon: pages.icon,
        order: pages.order,
        depth: pages.depth,
        created_by: pages.created_by,
        created_at: pages.created_at,
        updated_at: pages.updated_at,
        deleted_at: pages.deleted_at,
        workspace_name: workspaces.name,
      })
      .from(pages)
      .leftJoin(workspaces, eq(pages.workspace_id, workspaces.id))
      .where(
        and(
          eq(pages.workspace_id, workspaceId.value),
          isNull(pages.deleted_at),
          ilike(pages.title, `%${query}%`) // 검색 조건 추가
        )
      )
      .orderBy(desc(pages.updated_at))
      .limit(limit);

    return results.map(row => ({
      page: this.toDomain(row),
      workspaceName: row.workspace_name || 'Unknown Workspace',
    }));
  }

  /**
   * DB 모델 → Domain Entity 변환
   *
   * @param row - DB 조회 결과
   * @returns Page Entity
   */
  private toDomain(row: typeof pages.$inferSelect): Page {
    return new Page(
      new PageId(row.id),
      new WorkspaceId(row.workspace_id),
      row.parent_id ? new PageId(row.parent_id) : null,
      row.title,
      row.icon,
      row.order,
      row.depth,
      row.created_by,
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }
}
