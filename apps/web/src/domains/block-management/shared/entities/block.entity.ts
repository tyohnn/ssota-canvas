import { BlockId } from '../value-objects/block-id.vo';
import { BlockType } from '../value-objects/block-type.vo';
import { Metadata } from '../value-objects/metadata.vo';
import { BlockManagementError } from '../errors/block-management.error';

/**
 * Block Entity
 *
 * 블록의 핵심 정보와 비즈니스 로직을 캡슐화
 */
export class Block {
  private constructor(
    public readonly id: BlockId,
    public readonly workspaceId: string,
    public blockType: BlockType,
    public metadata: Metadata,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null
  ) {}

  /**
   * Block 생성
   *
   * @param id - Block ID
   * @param workspaceId - 워크스페이스 ID
   * @param blockType - 블록 타입
   * @param metadata - 메타데이터
   * @returns Block 인스턴스
   */
  static create(
    id: BlockId,
    workspaceId: string,
    blockType: BlockType,
    metadata: Metadata
  ): Block {
    const now = new Date();
    return new Block(id, workspaceId, blockType, metadata, now, now, null);
  }

  /**
   * 기존 데이터로 Block 재구성 (Repository에서 사용)
   *
   * @param id - Block ID
   * @param workspaceId - 워크스페이스 ID
   * @param blockType - 블록 타입
   * @param metadata - 메타데이터
   * @param createdAt - 생성 시각
   * @param updatedAt - 수정 시각
   * @param deletedAt - 삭제 시각
   * @returns Block 인스턴스
   */
  static reconstitute(
    id: BlockId,
    workspaceId: string,
    blockType: BlockType,
    metadata: Metadata,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null
  ): Block {
    return new Block(
      id,
      workspaceId,
      blockType,
      metadata,
      createdAt,
      updatedAt,
      deletedAt
    );
  }

  /**
   * 블록 타입 변경
   *
   * @param newType - 새로운 블록 타입
   */
  updateBlockType(newType: BlockType): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    this.blockType = newType;
    this.updatedAt = new Date();
  }

  /**
   * 메타데이터 업데이트
   *
   * @param newMetadata - 새로운 메타데이터
   */
  updateMetadata(newMetadata: Metadata): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    this.metadata = newMetadata;
    this.updatedAt = new Date();
  }

  /**
   * 소프트 삭제 처리
   */
  markAsDeleted(): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Block already deleted'
      );
    }

    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 삭제 취소
   */
  restore(): void {
    if (!this.isDeleted()) {
      throw new BlockManagementError(
        'INVALID_OPERATION',
        'Block is not deleted'
      );
    }

    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  /**
   * 삭제 여부 확인
   *
   * @returns 삭제 여부
   */
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
