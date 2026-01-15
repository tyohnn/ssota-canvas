/**
 * Action Transaction 생성 Action
 *
 * 패턴: withYoutubeBlockSecureAction HOF 사용
 *
 * ⚠️ Security: withYoutubeBlockSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Block 권한 및 타입 검증 (YouTube 블록인지 확인)
 */

'use server';

import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleActionTransactionRepository } from '../../backend/repositories/implementations/drizzle-action-transaction.repository';
import { createActionTransaction } from '../../backend/services';
import {
  type CreateActionTransactionRequest,
  CreateActionTransactionRequestSchema,
} from '../../shared/dtos/requests/action-transaction.requests';
import type { CreateActionTransactionDTO } from '../../shared/dtos/responses/action-transaction.responses';
import { withYoutubeBlockSecureAction } from '../secure-action';

/**
 * Action Transaction 생성 Action
 * 해당 블록이 속한 워크스페이스, 조직에 대한 권한이 있는지 확인
 * 블록의 타입이 유튜브 블록인지 확인
 */
export const createActionTransactionAction = withYoutubeBlockSecureAction(
  CreateActionTransactionRequestSchema,
  'createActionTransactionAction',
  createActionTransactionInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
      videoId: req.videoId,
      actionType: req.actionType,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ✅ Event Storming + DDD 패턴:
 * - Service에 SafeDTO 전달 (Command 변환은 Service 내부에서 수행)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 * - Block 권한 및 타입 검증 완료
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스 정보
 */
async function createActionTransactionInternal(
  safeDto: CreateActionTransactionRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<CreateActionTransactionDTO>> {
  try {
    // 1. Repository 생성
    const transactionRepository = new DrizzleActionTransactionRepository();

    // 2. Service Function 호출 (SafeDTO 전달)
    const result = await createActionTransaction(
      safeDto,
      transactionRepository
    );

    if (result.isError()) {
      return err(String(result.error), {
        code: 'ACTION_TRANSACTION_CREATION_FAILED',
        meta: { originalError: result.error },
      });
    }

    // 3. Response DTO 생성
    const aggregate = result.value;
    const transaction = aggregate.getTransaction();
    const response: CreateActionTransactionDTO = {
      transactionId: transaction.id.value,
    };

    return ok(response);
  } catch (error) {
    console.error('[createActionTransactionInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
