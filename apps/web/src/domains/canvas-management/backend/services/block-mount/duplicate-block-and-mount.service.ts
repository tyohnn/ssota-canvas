/**
 * 블럭 복제 및 마운트 서비스 로직
 */
import type { IBlockRepository } from '@/domains/block-management/backend/repositories/interfaces/block.repository.interface';
import {
  duplicateBlock,
  duplicateBlocks,
} from '@/domains/block-management/backend/services/block';
import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';

import { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import { DuplicateBlockMountCommand } from '../../../shared/commands';
import type {
  DuplicateBlockAndMountRequest,
  DuplicateBlocksAndMountRequest,
} from '../../../shared/dtos/requests';
import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import type { BlockMountRepository } from '../../repositories/interfaces/block-mount.repository.interface';

/**
 * 블럭 복제 (Block Management Service와 연동)
 * Story CM-010 구현
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음 (Trust Boundary 통과)
 * - SafeDTO → Command 변환 (Value Objects 생성)
 * - Aggregate에 Command 전달
 * - Domain Event 처리
 *
 * @param safeDto - 검증된 블럭 복제 요청 (SafeDTO)
 * @param safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param safeWorkspaceId - 검증된 워크스페이스 ID (권한 검증됨)
 * @param blockRepository - Block Repository
 * @param blockMountRepository - BlockMount Repository
 * @param eventLogPolicyContext - 선택: 제공 시 BlockMountDuplicatedEvent에서 block_created 로깅
 * @returns 복제된 BlockMountAggregate와 BlockAggregate
 */
export async function duplicateBlockAndMount(
  safeDto: DuplicateBlockAndMountRequest,
  safeUserId: UserId,
  safeWorkspaceId: WorkspaceId,
  blockRepository: IBlockRepository,
  blockMountRepository: BlockMountRepository,
  eventLogPolicyContext?: EventLogPolicyContext
): Promise<
  Result<
    {
      blockMountAggregate: BlockMountAggregate;
      blockAggregate: BlockAggregate;
    },
    Error
  >
> {
  try {
    const blockMountIdVO = new BlockMountId(safeDto.blockMountId);
    const originalAggregate =
      await blockMountRepository.findById(blockMountIdVO);

    if (!originalAggregate) {
      return Result.error(
        new CanvasManagementError(
          'BLOCK_MOUNT_NOT_FOUND',
          'Block mount not found'
        )
      );
    }

    const safeBlockSlug = originalAggregate
      .getBlockMount()
      .blockId.value.replace(/-/g, '')
      .toLowerCase()
      .slice(0, 8);
    const duplicateResult = await duplicateBlock({
      safeWorkspaceId,
      safeBlockSlug,
      safeUserId,
      blockRepository,
    });
    if (duplicateResult.isError()) {
      return Result.error(duplicateResult.error);
    }
    const duplicatedBlock = duplicateResult.value;

    const events = originalAggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));
    originalAggregate.markEventsAsCommitted();

    const blockAggregate = BlockAggregate.reconstitute(duplicatedBlock);
    const duplicateBlockMountCommand: DuplicateBlockMountCommand = {
      newBlockId: duplicatedBlock.id,
      originalBlockMount: originalAggregate.getBlockMount(),
      offsetX: safeDto.offsetX || 20,
      offsetY: safeDto.offsetY || 20,
      userId: safeUserId,
      blockType: duplicatedBlock.blockType.value,
    };
    const duplicatedAggregate = originalAggregate.duplicateBlockMount(
      duplicateBlockMountCommand
    );

    try {
      await blockMountRepository.create(duplicatedAggregate.getBlockMount());
    } catch (saveError) {
      return Result.error(
        new CanvasManagementError(
          'BLOCK_MOUNT_DUPLICATION_FAILED',
          `Failed to save duplicated block mount: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`,
          { originalError: saveError }
        )
      );
    }

    const mountEvents = duplicatedAggregate.getUncommittedEvents();
    await Promise.allSettled(
      mountEvents.map(event => event.handle(eventLogPolicyContext))
    );
    duplicatedAggregate.markEventsAsCommitted();

    return Result.success({
      blockMountAggregate: duplicatedAggregate,
      blockAggregate,
    });
  } catch (error) {
    return Result.error(
      new CanvasManagementError(
        'BLOCK_DUPLICATION_FAILED',
        `Failed to duplicate block: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      )
    );
  }
}

export type DuplicateBlocksAndMountParams = {
  safeDto: DuplicateBlocksAndMountRequest;
  safeUserId: UserId;
  safeWorkspaceId: WorkspaceId;
  blockRepository: IBlockRepository;
  blockMountRepository: BlockMountRepository;
  /** 선택: 제공 시 각 BlockMountDuplicatedEvent에서 block_created 로깅 */
  eventLogPolicyContext?: EventLogPolicyContext;
};

/**
 * 블럭 복제 (다중, 배치) — 1회 호출 위주
 *
 * - BlockMount findByIds 1회, Block duplicateBlocks 1회, BlockMount createMany 1회
 *
 * @param params - safeDto, safeUserId, safeWorkspaceId, blockRepository, blockMountRepository
 * @returns 복제된 BlockMountAggregate·BlockAggregate 배열
 */
export async function duplicateBlocksAndMount(
  params: DuplicateBlocksAndMountParams
): Promise<
  Result<
    Array<{
      blockMountAggregate: BlockMountAggregate;
      blockAggregate: BlockAggregate;
    }>,
    Error
  >
> {
  const {
    safeDto,
    safeUserId,
    safeWorkspaceId,
    blockRepository,
    blockMountRepository,
    eventLogPolicyContext,
  } = params;

  const blockMountIds = safeDto.blocks.map(
    b => new BlockMountId(b.blockMountId)
  );
  const originalBMs = await blockMountRepository.findByIds(blockMountIds);

  const firstMissing = originalBMs.findIndex(bm => bm === null);
  if (firstMissing !== -1) {
    return Result.error(
      new CanvasManagementError(
        'BLOCK_MOUNT_NOT_FOUND',
        `Block mount not found: ${safeDto.blocks[firstMissing]!.blockMountId}`
      )
    );
  }

  const safeBlockSlugs = (
    originalBMs as BlockMountAggregate[]
  ).map(bm =>
    bm
      .getBlockMount()
      .blockId.value.replace(/-/g, '')
      .toLowerCase()
      .slice(0, 8)
  );

  const blockResult = await duplicateBlocks({
    safeWorkspaceId,
    safeBlockSlugs,
    safeUserId,
    blockRepository,
  });
  if (blockResult.isError()) {
    return Result.error(blockResult.error);
  }
  const duplicatedBlocks = blockResult.value;

  const results: Array<{
    blockMountAggregate: BlockMountAggregate;
    blockAggregate: BlockAggregate;
  }> = [];
  const blockMountsToCreate: ReturnType<
    BlockMountAggregate['getBlockMount']
  >[] = [];

  for (let i = 0; i < safeDto.blocks.length; i++) {
    const originalAggregate = originalBMs[i] as BlockMountAggregate;
    const duplicatedBlock = duplicatedBlocks[i]!;
    const blockOpts = safeDto.blocks[i]!;

    const blockAggregate = BlockAggregate.reconstitute(duplicatedBlock);
    const duplicateBlockMountCommand: DuplicateBlockMountCommand = {
      newBlockId: duplicatedBlock.id,
      originalBlockMount: originalAggregate.getBlockMount(),
      offsetX: blockOpts.offsetX ?? 20,
      offsetY: blockOpts.offsetY ?? 20,
      userId: safeUserId,
      blockType: duplicatedBlock.blockType.value,
    };
    const duplicatedAggregate = originalAggregate.duplicateBlockMount(
      duplicateBlockMountCommand
    );
    results.push({ blockMountAggregate: duplicatedAggregate, blockAggregate });
    blockMountsToCreate.push(duplicatedAggregate.getBlockMount());
  }

  let persistedBlockMountIds: string[];
  try {
    persistedBlockMountIds =
      await blockMountRepository.createMany(blockMountsToCreate);
  } catch (saveError) {
    return Result.error(
      new CanvasManagementError(
        'BLOCK_MOUNT_DUPLICATION_FAILED',
        `Failed to save duplicated block mounts: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`,
        { originalError: saveError }
      )
    );
  }

  // 23505 재시도 시 새 ID가 반영되었을 수 있음 → aggregate에 보정
  for (let i = 0; i < results.length; i++) {
    const { blockMountAggregate } = results[i]!;
    const persistedId = persistedBlockMountIds[i]!;
    if (persistedId !== blockMountAggregate.getBlockMount().id.value) {
      blockMountAggregate.applyPersistedId(new BlockMountId(persistedId));
    }
  }

  // 멀티플 복제: 블록별로 BlockMountDuplicatedEvent 발생 → 각각 block_created 1건씩 감사 로그 (N건).
  // 배치 삭제처럼 한 건으로 묶지 않고, 복제 단위로 로깅함.
  for (const { blockMountAggregate } of results) {
    const events = blockMountAggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map(event => event.handle(eventLogPolicyContext))
    );
    blockMountAggregate.markEventsAsCommitted();
  }

  return Result.success(results);
}
