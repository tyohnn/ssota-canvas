/**
 * 블럭 생성 및 마운트 서비스 로직
 */
import type { IBlockRepository } from '@/domains/block-management/backend/repositories/interfaces/block.repository.interface';
import {
  createBlock,
  createBlocks,
} from '@/domains/block-management/backend/services/block';
import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import type { CreateBlockRequest } from '@/domains/block-management/shared/dtos/requests/block.requests';
import {
  getDefaultViewMode,
} from '@/domains/block-management/shared/types/block-view-modes';
import {
  type BlockType,
  getBlockSize,
  getBlockSizeForViewMode,
} from '@/domains/block-management/shared/types/block-types';
import type { EventLogPolicyContext } from '@/domains/event-management';
import type { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';

import { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import { MountBlockCommand } from '../../../shared/commands';
import type {
  CreateAndMountBlockRequest,
  CreateAndMountBlocksRequest,
} from '../../../shared/dtos/requests';
import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import { BlockViewMode } from '../../../shared/value-objects/block-view-mode.vo';
import { Position } from '../../../shared/value-objects/position.vo';
import { Size } from '../../../shared/value-objects/size.vo';
import { ViewModeSizes } from '../../../shared/value-objects/view-mode-sizes.vo';
import type { BlockMountRepository } from '../../repositories/interfaces/block-mount.repository.interface';

/**
 * 블럭 생성 및 마운트
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음 (Trust Boundary 통과)
 * - SafeDTO → Command 변환 (Value Objects 생성)
 * - Aggregate에 Command 전달
 * - Domain Event 처리
 *
 * @param safeDto - 검증된 블럭 생성 및 마운트 요청 (SafeDTO)
 * @param safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param safeWorkspaceId - 검증된 워크스페이스 ID (권한 검증됨)
 * @param blockRepository - Block Repository
 * @param blockMountRepository - BlockMount Repository
 * @param eventLogPolicyContext - 선택: 제공 시 BlockMountedEvent에서 block_created 로깅
 * @returns 생성된 BlockMountAggregate와 BlockAggregate
 */
export async function createAndMountBlock(
  safeDto: CreateAndMountBlockRequest,
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
    // 1. SafeDTO → Command 변환 (Value Objects 생성)
    const pageIdVO = new PageId(safeDto.pageId);
    const positionVO = new Position(safeDto.position.x, safeDto.position.y);
    const sizeVO = new Size(safeDto.size.width, safeDto.size.height);

    // 2. Block Management Service Function을 통해 블럭 생성
    const createBlockRequest: CreateBlockRequest = {
      workspaceId: safeWorkspaceId.value,
      blockType: safeDto.blockType,
      title: safeDto.title || 'New Block', // 전달받은 title 사용, 없으면 기본 제목
      initialProperties: safeDto.initialProperties, // 초기 properties 전달
      initialContent: safeDto.initialContent, // ✨ 초기 content 전달
    };
    const blockResult = await createBlock(
      createBlockRequest,
      safeUserId,
      blockRepository
    );
    if (blockResult.isError()) {
      return Result.error(blockResult.error);
    }
    const blockAggregate = blockResult.value;

    // 3. Canvas Management Aggregate 생성 (자체 이벤트 생성)
    // safeDto.blockType은 Zod로 검증된 값이므로 BlockType으로 안전하게 캐스팅 가능
    const blockType: BlockType = safeDto.blockType as BlockType;
    const blockMountId = BlockMountId.generate();
    // viewMode 결정: safeDto에서 제공되면 사용, 없으면 blockType에 따른 기본값 사용
    // 마크다운 블록은 'note'가 기본값, 다른 블록은 'original'이 기본값
    const viewMode = safeDto.viewMode
      ? BlockViewMode.create(safeDto.viewMode)
      : BlockViewMode.create(getDefaultViewMode(blockType));

    // 4. 모든 viewMode의 기본 크기 계산 및 ViewModeSizes 생성
    // 전달받은 size를 original viewMode에 사용하고, 다른 viewMode는 기본값 사용
    const originalSize = sizeVO; // 전달받은 크기 사용 (그룹 생성 시 계산된 크기)
    const cardSize = getBlockSizeForViewMode(blockType, 'card');
    const noteSize = getBlockSizeForViewMode(blockType, 'note');

    const viewModeSizes = ViewModeSizes.empty()
      .updateSizeForViewMode(
        'original',
        originalSize // 전달받은 크기 사용
      )
      .updateSizeForViewMode('card', new Size(cardSize.width, cardSize.height))
      .updateSizeForViewMode('note', new Size(noteSize.width, noteSize.height));

    const mountBlockCommand: MountBlockCommand = {
      blockMountId,
      pageId: pageIdVO,
      blockId: blockAggregate.getBlock().id,
      position: positionVO,
      size: sizeVO,
      viewMode, // viewMode 전달
      viewModeSizes, // 모든 viewMode의 크기 전달
      userId: safeUserId,
      blockType: blockAggregate.getBlock().blockType.value,
    };
    const blockMountAggregate =
      BlockMountAggregate.mountBlock(mountBlockCommand);

    // 4. Entity 저장
    try {
      await blockMountRepository.create(blockMountAggregate.getBlockMount());
    } catch (saveError) {
      return Result.error(
        new CanvasManagementError(
          'BLOCK_MOUNT_CREATION_FAILED',
          `Failed to save block mount: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`,
          { originalError: saveError }
        )
      );
    }

    // 5. 도메인 이벤트 처리 (context 있으면 block_created 로깅)
    const events = blockMountAggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map(event => event.handle(eventLogPolicyContext))
    );

    // 6. 이벤트 커밋
    blockMountAggregate.markEventsAsCommitted();

    // 7. 명시적 변수명으로 반환
    return Result.success({ blockMountAggregate, blockAggregate });
  } catch (error) {
    return Result.error(
      new CanvasManagementError(
        'BLOCK_MOUNT_CREATION_FAILED',
        `Block creation and mounting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      )
    );
  }
}

export type CreateBlocksAndMountParams = {
  safeDto: CreateAndMountBlocksRequest;
  safeUserId: UserId;
  safeWorkspaceId: WorkspaceId;
  blockRepository: IBlockRepository;
  blockMountRepository: BlockMountRepository;
  /** 선택: 제공 시 각 BlockMountedEvent에서 block_created 로깅 */
  eventLogPolicyContext?: EventLogPolicyContext;
};

/**
 * 블럭 생성 및 마운트 (다중, 배치)
 *
 * - Block: block-management createBlocks 1회 (bulk INSERT)
 * - BlockMount: createMany 1회로 일괄 INSERT
 */
export async function createBlocksAndMounts(
  params: CreateBlocksAndMountParams
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

  const createBlockRequests: CreateBlockRequest[] = safeDto.blocks.map(
    block => ({
      workspaceId: safeWorkspaceId.value,
      blockType: block.blockType,
      title: block.title || 'New Block',
      initialProperties: block.initialProperties,
      initialContent: block.initialContent,
    })
  );

  const blockResult = await createBlocks(
    createBlockRequests,
    safeUserId,
    blockRepository
  );
  if (blockResult.isError()) {
    return Result.error(blockResult.error);
  }
  const blockAggregates = blockResult.value;

  const pageIdVO = new PageId(safeDto.pageId);
  const results: Array<{
    blockMountAggregate: BlockMountAggregate;
    blockAggregate: BlockAggregate;
  }> = [];
  const blockMountsToCreate: ReturnType<
    BlockMountAggregate['getBlockMount']
  >[] = [];

  for (let i = 0; i < safeDto.blocks.length; i++) {
    const block = safeDto.blocks[i]!;
    const blockAggregate = blockAggregates[i]!;
    const positionVO = new Position(block.position.x, block.position.y);
    const sizeVO = new Size(block.size.width, block.size.height);
    const blockType = block.blockType as BlockType;
    const blockMountId = BlockMountId.generate();
    const viewMode = block.viewMode
      ? BlockViewMode.create(block.viewMode)
      : BlockViewMode.create(getDefaultViewMode(blockType));

    const originalSize = sizeVO;
    const cardSize = getBlockSizeForViewMode(blockType, 'card');
    const noteSize = getBlockSizeForViewMode(blockType, 'note');
    const viewModeSizes = ViewModeSizes.empty()
      .updateSizeForViewMode('original', originalSize)
      .updateSizeForViewMode('card', new Size(cardSize.width, cardSize.height))
      .updateSizeForViewMode('note', new Size(noteSize.width, noteSize.height));

    const mountBlockCommand: MountBlockCommand = {
      blockMountId,
      pageId: pageIdVO,
      blockId: blockAggregate.getBlock().id,
      position: positionVO,
      size: sizeVO,
      viewMode,
      viewModeSizes,
      userId: safeUserId,
      blockType: blockAggregate.getBlock().blockType.value,
    };
    const blockMountAggregate = BlockMountAggregate.mountBlock(mountBlockCommand);
    blockMountsToCreate.push(blockMountAggregate.getBlockMount());
    results.push({ blockMountAggregate, blockAggregate });
  }

  let persistedBlockMountIds: string[];
  try {
    persistedBlockMountIds =
      await blockMountRepository.createMany(blockMountsToCreate);
  } catch (saveError) {
    return Result.error(
      new CanvasManagementError(
        'BLOCK_MOUNT_CREATION_FAILED',
        `Failed to save block mounts: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`,
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

  for (const { blockMountAggregate } of results) {
    const events = blockMountAggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map(event => event.handle(eventLogPolicyContext))
    );
    blockMountAggregate.markEventsAsCommitted();
  }

  return Result.success(results);
}
