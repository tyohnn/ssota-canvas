import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

import { Block } from '../../../shared/entities/block.entity';
import { BlockId } from '../../../shared/value-objects/block-id.vo';

/**
 * BlockRepository Interface
 *
 * 블록 데이터 접근을 위한 Repository 인터페이스
 */
export interface IBlockRepository {
  /**
   * 블록 생성
   *
   * @param block - 생성할 블록
   * @returns Promise<void>
   */
  create(block: Block): Promise<void>;

  /**
   * 여러 블록 일괄 생성 (bulk INSERT)
   * 23505 시 전체 ID 재생성 후 재시도, 실제 반영된 ID 목록 반환 (입력 순서)
   *
   * @param blocks - 생성할 Block 배열
   * @returns Promise<string[]> - 실제 반영된 blockId 목록 (재시도 시 새 ID)
   */
  createMany(blocks: Block[]): Promise<string[]>;

  /**
   * 블록 업데이트
   *
   * @param block - 업데이트할 블록
   * @returns Promise<void>
   */
  update(block: Block): Promise<void>;

  /**
   * ID(UUID)로 블록 조회 (내부/레거시 전용, 예: source_job 처리)
   * 신규 코드는 findByWorkspaceIdAndSlug 사용.
   */
  findById(id: BlockId): Promise<Block | null>;

  /**
   * 워크스페이스 ID + slug로 블록 조회
   *
   * @param workspaceId - 워크스페이스 ID
   * @param slug - 8자 hex slug
   * @param includeDeleted - 삭제된 블록 포함 (복원 시 true)
   * @returns Promise<Block | null>
   */
  findByWorkspaceIdAndSlug(
    workspaceId: WorkspaceId,
    slug: string,
    includeDeleted?: boolean
  ): Promise<Block | null>;

  /**
   * 워크스페이스 ID + slug 배열로 블록 조회 (입력 slug 순서대로 반환, 없으면 null)
   *
   * @param workspaceId - 워크스페이스 ID
   * @param slugs - slug 배열
   * @returns Promise<(Block | null)[]>
   */
  findByWorkspaceIdAndSlugs(
    workspaceId: WorkspaceId,
    slugs: string[]
  ): Promise<(Block | null)[]>;

  /**
   * 워크스페이스 ID로 블록 목록 조회
   *
   * @param workspaceId - 워크스페이스 ID
   * @param includeDeleted - 삭제된 블록 포함 여부
   * @returns Promise<Block[]>
   */
  findByWorkspaceId(
    workspaceId: string,
    includeDeleted?: boolean
  ): Promise<Block[]>;

  /**
   * 블록 타입으로 블록 목록 조회
   *
   * @param workspaceId - 워크스페이스 ID
   * @param blockType - 블록 타입
   * @param includeDeleted - 삭제된 블록 포함 여부
   * @returns Promise<Block[]>
   */
  findByBlockType(
    workspaceId: string,
    blockType: string,
    includeDeleted?: boolean
  ): Promise<Block[]>;

  /**
   * 블록 삭제 (소프트 삭제)
   *
   * @param id - 블록 ID
   * @returns Promise<void>
   */
  delete(id: BlockId): Promise<void>;

  /**
   * 블록 영구 삭제
   *
   * @param id - 블록 ID
   * @returns Promise<void>
   */
  hardDelete(id: BlockId): Promise<void>;

  /**
   * 삭제된 블록 복원
   *
   * @param blockId - 블록 ID
   * @returns Promise<void>
   */
  restore(blockId: BlockId): Promise<void>;
}
