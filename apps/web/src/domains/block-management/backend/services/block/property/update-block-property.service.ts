/**
 * Block 속성 업데이트 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { UpdateBlockPropertyCommand } from '../../../../shared/commands';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import type { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import type { IBlockRepository } from '../../../repositories/interfaces/block.repository.interface';

export type UpdateBlockPropertyParams = {
  propertyPath: string;
  value: unknown;
  safeWorkspaceId: WorkspaceId;
  safeBlockSlug: string;
  safeUserId: UserId;
  blockRepository: IBlockRepository;
};

/**
 * 블록 속성 업데이트
 *
 * ✅ 권한 검증은 액션에서 완료. 서비스는 context에서 전달된 safeWorkspaceId 사용.
 */
export async function updateBlockProperty(
  params: UpdateBlockPropertyParams
): Promise<Result<{ updatedAt: Date }, Error>> {
  const {
    propertyPath,
    value,
    safeWorkspaceId,
    safeBlockSlug,
    safeUserId,
    blockRepository,
  } = params;
  try {
    if (!propertyPath || propertyPath.trim() === '') {
      return Result.error(
        new BlockManagementError(
          'INVALID_PROPERTY_PATH',
          'Property path is required'
        )
      );
    }

    const block = await blockRepository.findByWorkspaceIdAndSlug(
      safeWorkspaceId,
      safeBlockSlug
    );
    if (!block) {
      return Result.error(
        new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found')
      );
    }

    // 4. Aggregate 재구성
    const aggregate = BlockAggregate.reconstitute(block);

    // 5. SafeDTO → Command 변환
    const command: UpdateBlockPropertyCommand = {
      propertyPath,
      value,
      userId: safeUserId,
    };

    // 6. 블록 속성 업데이트
    aggregate.updateProperty(command);

    // 7. 블록 업데이트
    const updatedBlock = aggregate.getBlock();
    await blockRepository.update(updatedBlock);

    // 8. 도메인 이벤트 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    // 9. 이벤트 커밋
    aggregate.markEventsAsCommitted();

    // 10. 업데이트된 시간 반환
    return Result.success({ updatedAt: updatedBlock.updatedAt });
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'BLOCK_PROPERTY_UPDATE_FAILED',
        `Failed to update property: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
