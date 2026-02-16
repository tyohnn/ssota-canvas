/**
 * Block 속성 일괄 업데이트 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { UpdateBlockPropertyCommand } from '../../../../shared/commands';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import type { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import type { IBlockRepository } from '../../../repositories/interfaces/block.repository.interface';

export type UpdateBlockPropertiesParams = {
  properties: Record<string, unknown>;
  safeWorkspaceId: WorkspaceId;
  safeBlockSlug: string;
  safeUserId: UserId;
  blockRepository: IBlockRepository;
};

/**
 * 블록 속성 일괄 업데이트
 *
 * ✅ 권한 검증은 액션에서 완료. 서비스는 context에서 전달된 safeWorkspaceId 사용.
 */
export async function updateBlockProperties(
  params: UpdateBlockPropertiesParams
): Promise<Result<{ updatedAt: Date }, Error>> {
  const {
    properties,
    safeWorkspaceId,
    safeBlockSlug,
    safeUserId,
    blockRepository,
  } = params;
  try {
    const block = await blockRepository.findByWorkspaceIdAndSlug(
      safeWorkspaceId,
      safeBlockSlug
    );
    if (!block) {
      return Result.error(
        new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found')
      );
    }

    const aggregate = BlockAggregate.reconstitute(block);

    for (const [key, value] of Object.entries(properties)) {
      const command: UpdateBlockPropertyCommand = {
        propertyPath: `properties.${key}`,
        value,
        userId: safeUserId,
      };
      aggregate.updateProperty(command);
    }

    // 5. 블록 업데이트 (한 번만)
    const updatedBlock = aggregate.getBlock();
    await blockRepository.update(updatedBlock);

    // 6. 도메인 이벤트 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    // 7. 이벤트 커밋
    aggregate.markEventsAsCommitted();

    // 8. 업데이트된 시간 반환
    return Result.success({ updatedAt: updatedBlock.updatedAt });
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'BLOCK_PROPERTY_UPDATE_FAILED',
        `Failed to update properties: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
