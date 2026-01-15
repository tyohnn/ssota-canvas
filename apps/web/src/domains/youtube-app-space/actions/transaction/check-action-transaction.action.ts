/**
 * Action Transaction 확인 Action
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
import {
  type CheckActionTransactionRequest,
  CheckActionTransactionRequestSchema,
} from '../../shared/dtos/requests/action-transaction.requests';
import type { CheckActionTransactionDTO } from '../../shared/dtos/responses/action-transaction.responses';
import { withYoutubeBlockSecureAction } from '../secure-action';

/**
 * Action Transaction 확인 Action
 */
export const checkActionTransactionAction = withYoutubeBlockSecureAction(
  CheckActionTransactionRequestSchema,
  'checkActionTransactionAction',
  checkActionTransactionInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
      actionType: req.actionType,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 * - Block 권한 및 타입 검증 완료
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스 정보
 */
async function checkActionTransactionInternal(
  safeDto: CheckActionTransactionRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<CheckActionTransactionDTO>> {
  try {
    const actionTransactionRepository =
      new DrizzleActionTransactionRepository();
    const actionTransaction =
      await actionTransactionRepository.findByBlockIdAndActionType(
        safeDto.blockId,
        safeDto.actionType
      );

    const response: CheckActionTransactionDTO = {
      exists: !!actionTransaction,
    };

    return ok(response);
  } catch (error) {
    console.error('[checkActionTransactionInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
