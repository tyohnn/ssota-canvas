/**
 * 블럭 생성 및 마운트 서비스 로직
 */
import type { IBlockRepository } from '@/domains/block-management/backend/repositories/interfaces/block.repository.interface';
import { createBlock } from '@/domains/block-management/backend/services/block';
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
import type { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';

import { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import { MountBlockCommand } from '../../../shared/commands';
import type { CreateAndMountBlockRequest } from '../../../shared/dtos/requests';
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
 * @returns 생성된 BlockMountAggregate와 BlockAggregate
 */
export async function createAndMountBlock(
  safeDto: CreateAndMountBlockRequest,
  safeUserId: UserId,
  safeWorkspaceId: WorkspaceId,
  blockRepository: IBlockRepository,
  blockMountRepository: BlockMountRepository
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
      title: safeDto.title || '새 블럭', // 전달받은 title 사용, 없으면 기본 제목
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
    const originalSize = getBlockSize(blockType);
    const cardSize = getBlockSizeForViewMode(blockType, 'card');
    const noteSize = getBlockSizeForViewMode(blockType, 'note');

    const viewModeSizes = ViewModeSizes.empty()
      .updateSizeForViewMode(
        'original',
        new Size(originalSize.width, originalSize.height)
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

    // 5. 도메인 이벤트 처리
    const events = blockMountAggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

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
