import { BlockId } from '../../../shared/value-objects/block-id.vo';
import { BlockType } from '../../../shared/value-objects/block-type.vo';
import { Block } from '../../../shared/entities/block.entity';

/**
 * BlockRepository Interface
 *
 * 블록 데이터 접근을 위한 Repository 인터페이스
 */
export interface BlockRepository {
  /**
   * 블록 저장
   *
   * @param block - 저장할 블록
   * @returns Promise<void>
   */
  save(block: Block): Promise<void>;

  /**
   * 블록 ID로 조회
   *
   * @param id - 블록 ID
   * @returns Promise<Block | null>
   */
  findById(id: BlockId): Promise<Block | null>;

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
   * 블록 존재 여부 확인
   *
   * @param id - 블록 ID
   * @returns Promise<boolean>
   */
  exists(id: BlockId): Promise<boolean>;

  /**
   * 워크스페이스의 블록 개수 조회
   *
   * @param workspaceId - 워크스페이스 ID
   * @param includeDeleted - 삭제된 블록 포함 여부
   * @returns Promise<number>
   */
  countByWorkspaceId(
    workspaceId: string,
    includeDeleted?: boolean
  ): Promise<number>;

  /**
   * 블록 정보 업데이트
   *
   * @param blockId - 블록 ID
   * @param updateData - 업데이트할 데이터
   * @returns Promise<void>
   */
  updateBlock(
    blockId: BlockId,
    updateData: {
      title?: string;
      description?: string;
      properties?: Record<string, any>;
    }
  ): Promise<void>;

  /**
   * 블록 타입 변경
   *
   * @param blockId - 블록 ID
   * @param newBlockType - 새로운 블록 타입
   * @returns Promise<void>
   */
  updateBlockType(blockId: BlockId, newBlockType: BlockType): Promise<void>;

  /**
   * 블록 소프트 삭제
   *
   * @param blockId - 블록 ID
   * @returns Promise<void>
   */
  markAsDeleted(blockId: BlockId): Promise<void>;

  /**
   * 삭제된 블록 복원
   *
   * @param blockId - 블록 ID
   * @returns Promise<void>
   */
  restore(blockId: BlockId): Promise<void>;
}
