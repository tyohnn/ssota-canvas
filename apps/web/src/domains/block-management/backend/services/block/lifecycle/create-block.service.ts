/**
 * Block 생성 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';

import { BlockAggregate } from '../../../../shared/aggregates/block.aggregate';
import type { CreateBlockCommand } from '../../../../shared/commands';
import type { CreateBlockRequest } from '../../../../shared/dtos/requests/block.requests';
import { Block } from '../../../../shared/entities/block.entity';
import { BlockManagementError } from '../../../../shared/errors/block-management.error';
import { BlockId } from '../../../../shared/value-objects/block-id.vo';
import { BlockType } from '../../../../shared/value-objects/block-type.vo';
import type { IBlockRepository } from '../../../repositories/interfaces/block.repository.interface';

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
  blockRepository: IBlockRepository
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

/**
 * 블록 일괄 생성 (bulk)
 *
 * - createMany 1회로 DB INSERT
 * - 각 aggregate 도메인 이벤트는 DB 반영 후 처리
 */
export async function createBlocks(
  safeDtos: CreateBlockRequest[],
  safeUserId: UserId,
  blockRepository: IBlockRepository
): Promise<Result<BlockAggregate[], Error>> {
  if (safeDtos.length === 0) {
    return Result.success([]);
  }

  const aggregates: BlockAggregate[] = [];
  const blocksToCreate: ReturnType<BlockAggregate['getBlock']>[] = [];

  for (const safeDto of safeDtos) {
    const workspaceId = new WorkspaceId(safeDto.workspaceId);
    const blockType = new BlockType(safeDto.blockType);
    const command: CreateBlockCommand = {
      workspaceId,
      userId: safeUserId,
      blockId: BlockId.generate(),
      blockType,
      title: safeDto.title,
      initialProperties: safeDto.initialProperties,
      initialContent: safeDto.initialContent,
    };
    const aggregate = BlockAggregate.create(command);
    aggregates.push(aggregate);
    blocksToCreate.push(aggregate.getBlock());
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
        'BLOCK_CREATION_FAILED',
        `Failed to create blocks: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }

  // 23505 재시도 시 새 ID가 반영되었을 수 있음 → aggregate의 block id 보정
  for (let i = 0; i < aggregates.length; i++) {
    const aggregate = aggregates[i]!;
    const block = aggregate.getBlock();
    const persistedId = persistedBlockIds[i]!;
    if (persistedId !== block.id.value) {
      const newBlock = Block.reconstitute(
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
        block.contentVersion
      );
      aggregates[i] = BlockAggregate.reconstitute(newBlock);
    }
  }

  for (const aggregate of aggregates) {
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));
    aggregate.markEventsAsCommitted();
  }

  return Result.success(aggregates);
}
