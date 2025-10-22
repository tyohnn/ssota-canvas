import { Result } from '@/utils/result';
import { BlockId } from '../../shared/value-objects/block-id.vo';
import { BlockType } from '../../shared/value-objects/block-type.vo';
import { Metadata } from '../../shared/value-objects/metadata.vo';
import { Block } from '../../shared/entities/block.entity';
import { BlockDTO } from '../../shared/dtos/index';
import { CreateBlockCommand } from '../../shared/commands/index';
import { BlockManagementError } from '../../shared/errors/block-management.error';
import { BlockRepository } from '../repositories/interfaces/block.repository.interface';
import { DrizzleBlockRepository } from '../repositories/implementations/drizzle-block.repository';

/**
 * Block Management Service
 * 다른 도메인에서 블럭 관련 비즈니스 로직을 사용할 때 활용하는 서비스
 */
export class BlockManagementService {
  private blockRepository: BlockRepository;

  constructor(blockRepository?: BlockRepository) {
    this.blockRepository = blockRepository || new DrizzleBlockRepository();
  }

  /**
   * 블럭 생성
   * Canvas Management에서 호출
   */
  async createBlock(
    command: CreateBlockCommand
  ): Promise<Result<BlockDTO, BlockManagementError>> {
    try {
      // 1. 입력 유효성 검증
      if (!command.workspaceId || !this.isValidUUID(command.workspaceId)) {
        return Result.error(
          new BlockManagementError(
            'INVALID_WORKSPACE_ID',
            'Invalid workspace ID format'
          )
        );
      }

      if (!command.blockType || command.blockType.trim() === '') {
        return Result.error(
          new BlockManagementError(
            'INVALID_BLOCK_TYPE',
            'Block type is required'
          )
        );
      }

      // 2. Block 생성 - Repository에서 UUID 충돌 처리를 담당
      const blockTypeVO = new BlockType(command.blockType);
      const metadataVO = new Metadata(command.metadata || {});

      // 3. Repository를 통해 Block 생성 (UUID 충돌 시 재시도 포함)
      const block = await this.blockRepository.createBlock(
        blockTypeVO,
        command.workspaceId,
        metadataVO
      );

      // 5. DTO 생성 및 반환
      const dto: BlockDTO = {
        id: block.id.value,
        blockType: block.blockType.value,
        workspaceId: block.workspaceId,
        metadata: block.metadata.value || {},
        createdAt: block.createdAt.toISOString(),
        updatedAt: block.updatedAt.toISOString(),
      };

      return Result.success(dto);
    } catch (error) {
      console.error('Block creation failed:', error);
      return Result.error(
        new BlockManagementError(
          'DATABASE_CONNECTION_FAILED',
          'Block creation failed'
        )
      );
    }
  }

  /**
   * 블럭 복제
   * Canvas Management에서 호출
   */
  async duplicateBlock(command: {
    originalBlockId: BlockId;
    workspaceId: string;
    userId: string;
  }): Promise<Result<BlockDTO, BlockManagementError>> {
    try {
      // 1. 원본 블럭 조회
      const originalBlock = await this.blockRepository.findById(
        command.originalBlockId
      );

      if (!originalBlock) {
        return Result.error(
          new BlockManagementError(
            'BLOCK_NOT_FOUND',
            'Original block not found'
          )
        );
      }

      // 2. 새로운 블럭 생성 (원본과 동일한 타입과 메타데이터)
      const duplicatedBlock = await this.blockRepository.createBlock(
        originalBlock.blockType,
        command.workspaceId,
        originalBlock.metadata
      );

      // 3. DTO 생성 및 반환
      const dto: BlockDTO = {
        id: duplicatedBlock.id.value,
        blockType: duplicatedBlock.blockType.value,
        workspaceId: duplicatedBlock.workspaceId,
        metadata: duplicatedBlock.metadata.value || {},
        createdAt: duplicatedBlock.createdAt.toISOString(),
        updatedAt: duplicatedBlock.updatedAt.toISOString(),
      };

      return Result.success(dto);
    } catch (error) {
      console.error('Block duplication failed:', error);
      return Result.error(
        new BlockManagementError(
          'BLOCK_DUPLICATION_FAILED',
          'Failed to duplicate block'
        )
      );
    }
  }

  private isValidUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value.trim());
  }
}
