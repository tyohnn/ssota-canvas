import { Result } from '@/utils/result';
import { BlockId } from '../../shared/value-objects/block-id.vo';
import { BlockDTO } from '../../shared/dtos/index';
import { CreateBlockCommand } from '../../shared/commands/index';
import { BlockManagementError } from '../../shared/errors/block-management.error';

/**
 * Block Management Service
 * 다른 도메인에서 블럭 관련 비즈니스 로직을 사용할 때 활용하는 서비스
 */
export class BlockManagementService {
  constructor(
    // TODO: BlockRepository 주입 예정
  ) {}

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

      // 2. TODO: BlockAggregate.create() 호출
      // 3. TODO: BlockRepository.save() 호출

      // 4. 임시 DTO 생성 (실제로는 Aggregate에서 생성)
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000'); // 임시 ID
      const dto: BlockDTO = {
        id: blockId.value,
        blockType: command.blockType,
        workspaceId: command.workspaceId,
        metadata: command.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

  private isValidUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value.trim());
  }
}
