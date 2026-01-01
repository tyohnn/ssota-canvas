/**
 * 블럭 생성 및 마운트 서비스 로직
 */
import type { BlockManagementService } from '@/domains/block-management/backend/services/block-management.service';
import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import { BlockType } from '@/domains/block-management/shared/value-objects/block-type.vo';
import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import { BlockMountAggregate } from '@/domains/canvas-management/shared/aggregates/block-mount.aggregate';
import { MountBlockCommand } from '@/domains/canvas-management/shared/commands';
import type { CreateAndMountBlockRequest } from '@/domains/canvas-management/shared/dtos/requests';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { Position } from '@/domains/canvas-management/shared/value-objects/position.vo';
import { Size } from '@/domains/canvas-management/shared/value-objects/size.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';

import { handleDomainEvents } from './common';

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
 * @param blockManagementService - Block Management Service
 * @param blockMountRepository - BlockMount Repository
 * @returns 생성된 BlockMountAggregate와 BlockAggregate
 */
export async function createAndMountBlock(
  safeDto: CreateAndMountBlockRequest & {
    userId: string;
    workspaceId: string;
  },
  blockManagementService: BlockManagementService,
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
    const userIdVO = new UserId(safeDto.userId);
    const workspaceIdVO = new WorkspaceId(safeDto.workspaceId);
    const pageIdVO = new PageId(safeDto.pageId);
    const blockTypeVO = new BlockType(safeDto.blockType);
    const positionVO = new Position(safeDto.position.x, safeDto.position.y);
    const sizeVO = new Size(safeDto.size.width, safeDto.size.height);

    // 2. Block Management Service를 통해 블럭 생성 (완전한 Block 엔티티 반환)
    const blockAggregate = await blockManagementService.createBlock({
      userId: userIdVO,
      workspaceId: workspaceIdVO,
      blockType: blockTypeVO,
      title: safeDto.title || '새 블럭', // 전달받은 title 사용, 없으면 기본 제목
      initialProperties: safeDto.initialProperties, // 초기 properties 전달
      initialContent: safeDto.initialContent, // ✨ 초기 content 전달
    });

    // 3. Canvas Management Aggregate 생성 (자체 이벤트 생성)
    const blockMountId = new BlockMountId(crypto.randomUUID());
    const mountBlockCommand: MountBlockCommand = {
      blockMountId,
      pageId: pageIdVO,
      blockId: blockAggregate.getBlock().id,
      position: positionVO,
      size: sizeVO,
      userId: userIdVO,
    };
    const blockMountAggregate =
      BlockMountAggregate.mountBlock(mountBlockCommand);

    // 4. Entity 저장
    try {
      await blockMountRepository.create(blockMountAggregate.getBlockMount());
    } catch (saveError) {
      console.error(
        '❌ [createAndMountBlock] Failed to save block mount:',
        saveError
      );
      return Result.error(
        saveError instanceof Error
          ? saveError
          : new Error('Failed to save block mount')
      );
    }

    // 5. 이벤트 핸들러 실행 (Canvas Management 도메인 내부)
    const events = blockMountAggregate.getUncommittedEvents();
    await handleDomainEvents(events);

    // 6. 이벤트 커밋
    blockMountAggregate.markEventsAsCommitted();

    // 7. 명시적 변수명으로 반환
    return Result.success({ blockMountAggregate, blockAggregate });
  } catch (error) {
    console.error(
      '💥 [createAndMountBlock] Block creation and mounting failed:',
      error
    );
    return Result.error(new Error('Block creation and mounting failed'));
  }
}
