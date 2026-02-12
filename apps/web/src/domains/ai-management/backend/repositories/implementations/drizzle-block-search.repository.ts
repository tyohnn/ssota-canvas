/**
 * DrizzleBlockSearchRepository
 *
 * Drizzle ORM 기반 BlockSearchRepository 구현.
 * blocks + block_mounts JOIN으로 DB 레벨 필터링 수행.
 * 스코프·ID는 Value Object의 .value로 DB에 전달.
 */

import { and, eq, inArray, isNotNull, isNull, ilike, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { adminDb } from '@/db';
import { blocks, blockMounts, sources, sourceSummaries } from '@/db/schema';
import type { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import type { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import type {
  BlockSearchRepository,
  BlockSearchScope,
  GrepBlockRow,
  GlobBlockRow,
  ReadBlockRow,
  SourceContentRow,
  SourceSummaryRow,
} from '../interfaces/block-search.repository.interface';

export class DrizzleBlockSearchRepository implements BlockSearchRepository {
  /**
   * content_raw ILIKE 필터링으로 매칭 블록 조회
   */
  async findByContentPattern(
    patterns: string[],
    scope: BlockSearchScope
  ): Promise<GrepBlockRow[]> {
    const conditions = this.buildScopeConditions(scope);
    if (patterns.length === 0) {
      return [];
    }
    if (patterns.length === 1) {
      conditions.push(ilike(blocks.content_raw, `%${patterns[0]}%`));
    } else {
      conditions.push(
        or(
          ...patterns.map(p => ilike(blocks.content_raw, `%${p}%`))
        )!
      );
    }

    const rows = await adminDb
      .select({
        blockMountId: blockMounts.id,
        blockType: blocks.block_type,
        title: blocks.title,
        contentRaw: blocks.content_raw,
      })
      .from(blockMounts)
      .innerJoin(blocks, eq(blockMounts.block_id, blocks.id))
      .where(and(...conditions));

    return rows;
  }

  /**
   * 메타데이터(title, type)로 블록 검색
   */
  async findByMetadata(
    titlePattern: string | undefined,
    scope: BlockSearchScope,
    limit: number
  ): Promise<GlobBlockRow[]> {
    const conditions = this.buildScopeConditions(scope);
    if (titlePattern) {
      conditions.push(ilike(blocks.title, `%${titlePattern}%`));
    }

    const rows = await adminDb
      .select({
        blockMountId: blockMounts.id,
        blockType: blocks.block_type,
        title: blocks.title,
        parentBlockMountId: blockMounts.parent_block_mount_id,
        createdAt: blocks.created_at,
        updatedAt: blocks.updated_at,
      })
      .from(blockMounts)
      .innerJoin(blocks, eq(blockMounts.block_id, blocks.id))
      .where(and(...conditions))
      .limit(limit);

    return rows;
  }

  /**
   * blockMountId로 단일 블록의 content_raw 조회
   */
  async findContentByBlockMountId(
    blockMountId: BlockMountId,
    pageId?: PageId
  ): Promise<ReadBlockRow | null> {
    const conditions: ReturnType<typeof eq>[] = [
      eq(blockMounts.id, blockMountId.value),
      isNull(blockMounts.deleted_at),
      isNull(blocks.deleted_at),
    ];

    if (pageId) {
      conditions.push(eq(blockMounts.page_id, pageId.value));
    }

    const rows = await adminDb
      .select({
        blockMountId: blockMounts.id,
        blockType: blocks.block_type,
        title: blocks.title,
        contentRaw: blocks.content_raw,
      })
      .from(blockMounts)
      .innerJoin(blocks, eq(blockMounts.block_id, blocks.id))
      .where(and(...conditions))
      .limit(1);

    return rows[0] ?? null;
  }

  /**
   * sources.raw_content ILIKE 필터링으로 매칭 블록 조회
   */
  async findBySourceContentPattern(
    patterns: string[],
    scope: BlockSearchScope
  ): Promise<SourceContentRow[]> {
    const conditions = this.buildScopeConditions(scope);
    conditions.push(isNotNull(blocks.source_id));
    conditions.push(isNotNull(sources.raw_content));

    if (patterns.length === 0) {
      return [];
    }
    if (patterns.length === 1) {
      conditions.push(ilike(sources.raw_content, `%${patterns[0]}%`));
    } else {
      conditions.push(
        or(...patterns.map(p => ilike(sources.raw_content, `%${p}%`)))!
      );
    }

    const rows = await adminDb
      .select({
        blockMountId: blockMounts.id,
        blockType: blocks.block_type,
        title: blocks.title,
        rawContent: sources.raw_content,
      })
      .from(blockMounts)
      .innerJoin(blocks, eq(blockMounts.block_id, blocks.id))
      .innerJoin(sources, eq(blocks.source_id, sources.id))
      .where(and(...conditions));

    return rows as SourceContentRow[];
  }

  /**
   * source_summaries.summary ILIKE 필터링으로 매칭 블록·요약 조회
   */
  async findBySourceSummaryPattern(
    patterns: string[],
    scope: BlockSearchScope,
    languages?: string[]
  ): Promise<SourceSummaryRow[]> {
    const conditions = this.buildScopeConditions(scope);
    conditions.push(isNotNull(blocks.source_id));

    if (patterns.length === 0) {
      return [];
    }
    if (patterns.length === 1) {
      conditions.push(ilike(sourceSummaries.summary, `%${patterns[0]}%`));
    } else {
      conditions.push(
        or(
          ...patterns.map(p => ilike(sourceSummaries.summary, `%${p}%`))
        )!
      );
    }
    if (languages?.length) {
      conditions.push(inArray(sourceSummaries.language, languages));
    }

    const rows = await adminDb
      .select({
        blockMountId: blockMounts.id,
        blockType: blocks.block_type,
        title: blocks.title,
        language: sourceSummaries.language,
        summary: sourceSummaries.summary,
      })
      .from(blockMounts)
      .innerJoin(blocks, eq(blockMounts.block_id, blocks.id))
      .innerJoin(sources, eq(blocks.source_id, sources.id))
      .innerJoin(sourceSummaries, eq(sources.id, sourceSummaries.source_id))
      .where(and(...conditions));

    return rows;
  }

  /**
   * 스코프 조건 빌드 (공통)
   * targetBlockMountIds / pageId / workspaceId는 VO.value 사용
   */
  private buildScopeConditions(scope: BlockSearchScope): SQL[] {
    const conditions: SQL[] = [
      isNull(blockMounts.deleted_at),
      isNull(blocks.deleted_at),
    ];

    if (scope.targetBlockMountIds?.length) {
      conditions.push(
        inArray(blockMounts.id, scope.targetBlockMountIds.map(id => id.value))
      );
    } else if (scope.pageId) {
      conditions.push(eq(blockMounts.page_id, scope.pageId.value));
    }

    if (scope.workspaceId) {
      conditions.push(eq(blocks.workspace_id, scope.workspaceId.value));
    }

    if (scope.blockTypes?.length) {
      conditions.push(inArray(blocks.block_type, scope.blockTypes as never));
    }

    return conditions;
  }
}
