import { BlockId } from '../../../shared/value-objects/block-id.vo';
import { Block } from '../../../shared/entities/block.entity';

/**
 * Block Repository Interface
 *
 * Block Aggregate의 영속성을 담당하는 Repository 계약
 */
export interface BlockRepository {
  /**
   * Block 저장 (생성 또는 업데이트)
   *
   * @param block - Block Entity 또는 Aggregate
   */
  save(block: Block): Promise<void>;

  /**
   * ID로 Block 조회
   *
   * @param id - Block ID
   * @returns Block Entity 또는 null
   */
  findById(id: BlockId): Promise<Block | null>;

  /**
   * 워크스페이스의 모든 Block 조회
   *
   * ⚠️ 주의: Service Layer에서 워크스페이스 멤버십 확인 후에만 호출!
   *
   * @param workspaceId - 워크스페이스 ID
   * @returns Block Entity 배열
   */
  findByWorkspaceId(workspaceId: string): Promise<Block[]>;

  /**
   * Block 소프트 삭제
   *
   * @param id - Block ID
   */
  delete(id: BlockId): Promise<void>;

  /**
   * 워크스페이스별 활성 블록 목록 조회 (페이징 지원)
   *
   * @param workspaceId - 워크스페이스 ID
   * @param page - 페이지 번호 (기본값: 1)
   * @param limit - 페이지당 항목 수 (기본값: 50)
   * @returns Block Entity 배열
   */
  listBlocksByWorkspace(
    workspaceId: string,
    page?: number,
    limit?: number
  ): Promise<Block[]>;
}
