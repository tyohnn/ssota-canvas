/**
 * Action Transaction 생성 서비스 로직
 */
import { Result } from '@/utils/result';

import { ActionTransactionAggregate } from '../../../shared/aggregates/action-transaction.aggregate';
import type { CreateActionTransactionCommand } from '../../../shared/commands/action-transaction.commands';
import type { CreateActionTransactionRequest } from '../../../shared/dtos/requests/video.requests';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import type { IActionTransactionRepository } from '../../repositories/interfaces/action-transaction.repository.interface';

/**
 * Action Transaction 생성
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음 (Trust Boundary 통과)
 * - SafeDTO → Command 변환
 * - Aggregate에 Command 전달
 * - Domain Event 처리
 *
 * @param safeDto - 검증된 Action Transaction 생성 요청 (SafeDTO)
 * @param transactionRepository - Action Transaction Repository
 * @returns ActionTransactionAggregate
 */
export async function createActionTransaction(
  safeDto: CreateActionTransactionRequest,
  transactionRepository: IActionTransactionRepository
): Promise<Result<ActionTransactionAggregate, YoutubeError>> {
  try {
    // 1. SafeDTO → Command 변환
    const command: CreateActionTransactionCommand = {
      blockId: safeDto.blockId,
      videoId: safeDto.videoId,
      actionType: safeDto.actionType,
    };

    // 2. Aggregate 생성 (Command 전달)
    const aggregate = ActionTransactionAggregate.createTransaction(command);

    // 3. Aggregate 저장 (트랜잭션)
    await transactionRepository.create(aggregate);

    // 4. 도메인 이벤트 처리
    const uncommittedEvents = aggregate.getUncommittedEvents();
    await Promise.allSettled(uncommittedEvents.map(event => event.handle()));

    // 5. 이벤트 커밋
    aggregate.markEventsAsCommitted();

    // 6. Result.success(aggregate) 반환
    return Result.success(aggregate);
  } catch (error) {
    // YoutubeError인 경우 그대로 반환
    if (error instanceof YoutubeError) {
      return Result.error(error);
    }

    return Result.error(
      new YoutubeError(
        'ACTION_TRANSACTION_CREATION_FAILED',
        error instanceof Error
          ? error.message
          : 'Failed to create action transaction',
        {
          blockId: safeDto.blockId,
          videoId: safeDto.videoId,
          actionType: safeDto.actionType,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}
