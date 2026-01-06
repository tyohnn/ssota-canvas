/**
 * Block 생성 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { CreateBlockCommand } from '../../../../shared/commands';
import type { CreateBlockRequest } from '../../../../shared/dtos/requests/block.requests';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import { BlockId } from '../../../../shared/value-objects/block-id.vo';
import { BlockType } from '../../../../shared/value-objects/block-type.vo';
import type { BlockRepository } from '../../../repositories/interfaces/block.repository.interface';

/**
 * 블록 생성
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음
 * - SafeDTO → Command 변환
 * - Aggregate에 Command 전달
 *
 * @param safeDto - 검증된 블록 생성 요청 (SafeDTO)
 * @param safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param blockRepository - Block Repository
 * @returns 생성된 블록 Aggregate
 */
export async function createBlock(
  safeDto: CreateBlockRequest,
  safeUserId: UserId,
  blockRepository: BlockRepository
): Promise<Result<BlockAggregate, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const workspaceId = new WorkspaceId(safeDto.workspaceId);
    const blockType = new BlockType(safeDto.blockType);

    // 2. SafeDTO → Command 변환
    const command: CreateBlockCommand = {
      workspaceId,
      userId: safeUserId,
      blockId: BlockId.generate(),
      blockType,
      title: safeDto.title,
      initialProperties: safeDto.initialProperties,
      initialContent: safeDto.initialContent,
    };

    // 3. Aggregate 생성 (Command → Event)
    const aggregate = BlockAggregate.create(command);

    // 4. 블록 생성
    await blockRepository.create(aggregate.getBlock());

    // 5. 도메인 이벤트 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    // 6. 이벤트 커밋
    aggregate.markEventsAsCommitted();

    // 7. 결과 반환
    return Result.success(aggregate);
  } catch (error) {
    if (error instanceof BlockManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new BlockManagementError(
        'BLOCK_CREATION_FAILED',
        `Failed to create block: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
