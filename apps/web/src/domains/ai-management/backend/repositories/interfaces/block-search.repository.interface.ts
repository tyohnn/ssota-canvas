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
   * @param titlePattern - 제목 패턴 (ILIKE, optional)
   * @param scope - 검색 스코프 (VO 기반)
   * @param limit - 최대 결과 수
   * @returns 블록 메타데이터 배열
   */
  findByMetadata(
    titlePattern: string | undefined,
    scope: BlockSearchScope,
    limit: number
  ): Promise<GlobBlockRow[]>;

  /**
   * blockMountId로 단일 블록의 content_raw 조회
   *
   * @param blockMountId - 블록 마운트 ID (VO)
   * @param pageId - 페이지 스코프 (보안 검증, optional, VO)
   * @returns 블록 행 또는 null
   */
  findContentByBlockMountId(
    blockMountId: BlockMountId,
    pageId?: PageId
  ): Promise<ReadBlockRow | null>;

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
