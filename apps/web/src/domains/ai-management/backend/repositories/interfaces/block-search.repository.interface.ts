/**
 * BlockSearchRepository Interface
 *
 * Agent tool executor가 사용하는 블록 검색/조회 Repository.
 * blocks + block_mounts JOIN 쿼리를 캡슐화한다.
 *
 * - grep: content_raw에서 패턴 검색 (DB ILIKE 필터링)
 * - glob: 메타데이터(title, type) 검색
 * - read: 특정 블록의 content_raw 조회
 *
 * 패턴: block/canvas 도메인과 동일하게 ID·스코프는 Value Object 사용.
 */

import type { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import type { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import type { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

// ─── Scope (Query Parameter) ─────────────────────────────────────────────
// 스코프는 Repository 입력이므로 도메인 VO 사용. Service에서 SafeDTO → VO 변환 후 전달.

export interface BlockSearchScope {
  /** 특정 블록만 검색 (최우선) */
  targetBlockMountIds?: BlockMountId[];
  /** 페이지 스코프 (기본) */
  pageId?: PageId;
  /** 워크스페이스 스코프 */
  workspaceId?: WorkspaceId;
  /** 블록 타입 필터 */
  blockTypes?: string[];
}

// ─── Read Model (Repository 반환 타입) ─────────────────────────────────────
// 조회 전용이므로 Entity/Aggregate 대신 plain row 타입 사용 (Read Model 패턴).

export interface GrepBlockRow {
  blockMountId: string;
  blockType: string;
  title: string;
  contentRaw: string | null;
}

export interface GlobBlockRow {
  blockMountId: string;
  blockType: string;
  title: string;
  parentBlockMountId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadBlockRow {
  blockMountId: string;
  blockType: string;
  title: string;
  contentRaw: string | null;
}

/** Scope 내 블록 중 source_id가 있고 sources.raw_content가 NOT NULL인 행 (source_content 검색용) */
export interface SourceContentRow {
  blockMountId: string;
  blockType: string;
  title: string;
  rawContent: string;
}

/** Scope 내 블록의 source_summaries 행 (source_summary 검색용) */
export interface SourceSummaryRow {
  blockMountId: string;
  blockType: string;
  title: string;
  language: string;
  summary: string;
}

// ─── Interface ────────────────────────────────────────────────────────────

export interface BlockSearchRepository {
  /**
   * content_raw ILIKE 필터링으로 매칭 블록 조회
   * DB 레벨 1차 필터링 → 서비스 레이어에서 라인 파싱
   * 여러 패턴 시 OR 조건 (하나라도 포함되면 매칭)
   *
   * @param patterns - 검색 패턴 배열 (각각 ILIKE 서브스트링, OR)
   * @param scope - 검색 스코프 (VO 기반)
   * @returns content_raw가 포함된 블록 행 배열
   */
  findByContentPattern(
    patterns: string[],
    scope: BlockSearchScope
  ): Promise<GrepBlockRow[]>;

  /**
   * 메타데이터(title, type)로 블록 검색
   *
   * @param titlePatterns - 제목 패턴 배열 (각각 ILIKE 서브스트링). empty/undefined면 제목 조건 없음.
   * @param queryMatchMode - 'any' = 하나라도 포함 (OR), 'all' = 모두 포함 (AND). 패턴 2개 이상일 때만 적용.
   * @param scope - 검색 스코프 (VO 기반)
   * @param limit - 최대 결과 수
   * @returns 블록 메타데이터 배열
   */
  findByMetadata(
    titlePatterns: string[] | undefined,
    queryMatchMode: 'any' | 'all',
    scope: BlockSearchScope,
    limit: number
  ): Promise<GlobBlockRow[]>;

  /**
   * blockMountId로 단일 블록의 content_raw 조회
   *
   * @param blockMountId - 블록 마운트 ID (VO, UUID)
   * @param pageId - 페이지 스코프 (보안 검증, optional, VO)
   * @returns 블록 행 또는 null
   */
  findContentByBlockMountId(
    blockMountId: BlockMountId,
    pageId?: PageId
  ): Promise<ReadBlockRow | null>;

  /**
   * slug + pageId로 block_mounts.id (UUID) 조회
   * AI는 항상 slug를 전달하므로, 서비스에서 이 메서드로 UUID를 먼저 조회한 뒤 findContentByBlockMountId 등 호출
   */
  findBlockMountIdBySlugAndPageId(
    slug: string,
    pageId: PageId
  ): Promise<string | null>;

  /**
   * blockMountId로 단일 블록의 sources.raw_content 조회
   * block_mounts ⋈ blocks ⋈ sources, source_id IS NOT NULL, raw_content IS NOT NULL
   *
   * @param blockMountId - 블록 마운트 ID (VO)
   * @param pageId - 페이지 스코프 (보안 검증, optional, VO)
   * @returns SourceContentRow 또는 null
   */
  findSourceContentByBlockMountId(
    blockMountId: BlockMountId,
    pageId?: PageId
  ): Promise<SourceContentRow | null>;

  /**
   * blockMountId로 단일 블록의 source_summaries 한 건 조회
   * block_mounts ⋈ blocks ⋈ sources ⋈ source_summaries. language 지정 시 해당 언어만, 미지정 시 하나 반환 (order by language)
   *
   * @param blockMountId - 블록 마운트 ID (VO)
   * @param pageId - 페이지 스코프 (보안 검증, optional, VO)
   * @param language - 요약 언어 (optional). 미지정 시 하나 임의 반환
   * @returns SourceSummaryRow 또는 null
   */
  findSourceSummaryByBlockMountId(
    blockMountId: BlockMountId,
    pageId?: PageId,
    language?: string
  ): Promise<SourceSummaryRow | null>;

  /**
   * sources.raw_content ILIKE 필터링으로 매칭 블록 조회
   * block_mounts ⋈ blocks ⋈ sources, raw_content IS NOT NULL
   *
   * @param patterns - 검색 패턴 배열 (OR)
   * @param scope - 검색 스코프
   * @returns rawContent가 포함된 블록 행 배열
   */
  findBySourceContentPattern(
    patterns: string[],
    scope: BlockSearchScope
  ): Promise<SourceContentRow[]>;

  /**
   * source_summaries.summary ILIKE 필터링으로 매칭 블록·요약 조회
   * block_mounts ⋈ blocks ⋈ sources ⋈ source_summaries
   *
   * @param patterns - 검색 패턴 배열 (OR)
   * @param scope - 검색 스코프
   * @param languages - 요약 언어 필터 (optional)
   * @returns 매칭된 (blockMountId, language, summary) 행 배열
   */
  findBySourceSummaryPattern(
    patterns: string[],
    scope: BlockSearchScope,
    languages?: string[]
  ): Promise<SourceSummaryRow[]>;
}
