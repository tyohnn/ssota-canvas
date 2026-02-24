/**
 * Block 복제 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { DuplicateBlockCommand } from '../../../../shared/commands';
import { Block } from '../../../../shared/entities/block.entity';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import { BlockId } from '../../../../shared/value-objects/block-id.vo';
import type { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import type { IBlockRepository } from '../../../repositories/interfaces/block.repository.interface';

export type DuplicateBlockParams = {
  safeWorkspaceId: WorkspaceId;
  safeBlockSlug: string;
  safeUserId: UserId;
  blockRepository: IBlockRepository;
};

/**
 * 블록 복제
 *
 * ✅ 권한 검증은 액션에서 완료. 서비스는 context에서 전달된 safeWorkspaceId 사용.
 */
export async function duplicateBlock(
  params: DuplicateBlockParams
): Promise<Result<Block, Error>> {
  const { safeWorkspaceId, safeBlockSlug, safeUserId, blockRepository } = params;
  try {
    const originalBlock = await blockRepository.findByWorkspaceIdAndSlug(
      safeWorkspaceId,
      safeBlockSlug
    );
    if (!originalBlock) {
      return Result.error(
        new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found')
      );
    }

    // 3. Aggregate 재구성
    const originalBlockAggregate = BlockAggregate.reconstitute(originalBlock);

    // 4. SafeDTO → Command 변환
    const command: DuplicateBlockCommand = {
      userId: safeUserId,
    };

    // 5. 블록 복제 (Command → Event)
    const duplicatedBlockAggregate = originalBlockAggregate.duplicate(command);
    const duplicatedBlock = duplicatedBlockAggregate.getBlock();

    // 6. 블록 생성
    await blockRepository.create(duplicatedBlock);

    // 7. 도메인 이벤트 처리
    const events = duplicatedBlockAggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    // 8. 이벤트 커밋
    duplicatedBlockAggregate.markEventsAsCommitted();

    // 9. 결과 반환
    return Result.success(duplicatedBlock);
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'BLOCK_DUPLICATION_FAILED',
        `Failed to duplicate block: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}

export type DuplicateBlocksParams = {
  safeWorkspaceId: WorkspaceId;
  safeBlockSlugs: string[];
  safeUserId: UserId;
  blockRepository: IBlockRepository;
};

/**
 * 블록 일괄 복제 (bulk)
 *
 * ✅ 권한 검증은 액션에서 완료. 서비스는 context에서 전달된 safeWorkspaceId 사용.
 */
export async function duplicateBlocks(
  params: DuplicateBlocksParams
): Promise<Result<Block[], Error>> {
  const { safeWorkspaceId, safeBlockSlugs, safeUserId, blockRepository } = params;
  if (safeBlockSlugs.length === 0) {
    return Result.success([]);
  }

  const originalBlocks =
    await blockRepository.findByWorkspaceIdAndSlugs(safeWorkspaceId, safeBlockSlugs);

  const firstMissing = originalBlocks.findIndex(b => b === null);
  if (firstMissing !== -1) {
    return Result.error(
      new BlockManagementError(
        'BLOCK_NOT_FOUND',
        `Block not found: ${safeBlockSlugs[firstMissing]}`
      )
    );
  }

  const aggregates: BlockAggregate[] = [];
  const blocksToCreate: Block[] = [];

  const command: DuplicateBlockCommand = { userId: safeUserId };

  for (const originalBlock of originalBlocks as Block[]) {
    const originalAggregate = BlockAggregate.reconstitute(originalBlock);
    const duplicatedAggregate = originalAggregate.duplicate(command);
    aggregates.push(duplicatedAggregate);
    blocksToCreate.push(duplicatedAggregate.getBlock());
  }

  let persistedBlockIds: string[];
  try {
    persistedBlockIds = await blockRepository.createMany(blocksToCreate);
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'BLOCK_DUPLICATION_FAILED',
        `Failed to duplicate blocks: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }

  // 23505 재시도 시 새 ID가 반영되었을 수 있음 → 반환 Block[] id 보정
  const resultBlocks = blocksToCreate.map((block, i) => {
    const persistedId = persistedBlockIds[i]!;
    if (persistedId === block.id.value) return block;
    return Block.reconstitute(
      new BlockId(persistedId),
      block.workspaceId,
      block.userId,
      block.blockType,
      block.title,
      block.properties,
      block.customProperties,
      block.createdAt,
      block.updatedAt,
      block.deletedAt,
      block.content,
      block.createdByProfile,
      block.sourceId,
      block.contentVersion,
      // slug 미전달: createMany 재시도로 persistedId만 갱신된 경우. getSlug() 호출 시 id에서 8자 hex 유도
      undefined
    );
  });

  for (const aggregate of aggregates) {
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));
    aggregate.markEventsAsCommitted();
  }

  return Result.success(resultBlocks);
}
