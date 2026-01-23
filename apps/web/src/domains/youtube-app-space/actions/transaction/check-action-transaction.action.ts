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

import { DrizzleBlockRepository } from '../../../block-management/backend/repositories/implementations/drizzle-block.repository';
import { BlockId } from '../../../block-management/shared/value-objects/block-id.vo';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '../../../block-management/shared/value-objects/block-properties';
import { DrizzleActionTransactionRepository } from '../../backend/repositories/implementations/drizzle-action-transaction.repository';
import { DrizzleVideoSummaryRepository } from '../../backend/repositories/implementations/drizzle-video-summary.repository';
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
    // 1. Block 조회하여 youtubeId 추출
    const blockRepository = new DrizzleBlockRepository();
    const block = await blockRepository.findById(new BlockId(safeDto.blockId));

    if (!block) {
      return err('Block not found', { code: 'BLOCK_NOT_FOUND' });
    }

    // 2. Block Properties에서 youtubeId 추출
    const properties = block.properties;
    const propertiesJSON = properties.toJSON() as YoutubeBlockProperties;
    const youtubeProperties = YoutubeBlockPropertiesVO.fromJSON(propertiesJSON);
    const youtubeId = youtubeProperties.youtubeId;

    if (!youtubeId) {
      return err('YouTube ID not found in block properties', {
        code: 'YOUTUBE_ID_NOT_FOUND',
      });
    }

    // 3. Org 기반으로 action_transactions 확인
    const actionTransactionRepository =
      new DrizzleActionTransactionRepository();

    let actionTransaction = null;

    // extract_summary는 language가 필요하므로 다른 메서드 사용
    if (safeDto.actionType === 'extract_summary') {
      // extract_summary는 언어별로 관리되므로, 모든 언어의 요약을 확인
      // 하나라도 해당 조직에서 추출한 요약이 있으면 exists: true 반환
      if (!context.organization?.id) {
        // 익명 유저는 action_transaction 확인 불가
        actionTransaction = null;
      } else {
        const videoSummaryRepository = new DrizzleVideoSummaryRepository();
        const allSummaries = await videoSummaryRepository.findAllByVideoId(youtubeId);

        // 각 언어별로 action_transaction 확인
        for (const summary of allSummaries) {
          const summaryEntity = summary.getSummary();
          const transaction = await actionTransactionRepository.findByOrgVideoAndLanguage(
            context.organization.id,
            youtubeId,
            'extract_summary',
            summaryEntity.language.value
          );
          if (transaction) {
            actionTransaction = transaction;
            break; // 하나라도 있으면 충분
          }
        }
      }
    } else {
      // extract_script, smart_summary는 language가 필요 없음
      actionTransaction = await actionTransactionRepository.findByOrgAndVideo(
        context.organization.id,
        youtubeId,
        safeDto.actionType
      );
    }

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
