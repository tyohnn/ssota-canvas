/**
 * 스마트 요약 Action
 *
 * 패턴: withActionTransactionAuth HOF 사용 (이중 보안)
 *
 * ⚠️ Security: withActionTransactionAuth HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Transaction 존재 및 Block 일치 확인
 * 4. Transaction 상태 확인 (중복 실행 방지)
 * 5. Block 권한 및 타입 검증
 */

'use server';

import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleActionTransactionRepository } from '../../backend/repositories/implementations/drizzle-action-transaction.repository';
import { DrizzleVideoRepository } from '../../backend/repositories/implementations/drizzle-video.repository';
import type { CompleteActionTransactionCommand } from '../../shared/commands/action-transaction.commands';
import {
  SmartSummaryRequestSchema,
  type SmartSummaryRequest,
} from '../../shared/dtos/requests/video.requests';
import type { SmartSummaryDTO } from '../../shared/dtos/responses/video.responses';
import { withActionTransactionAuth } from '../secure-action';

/**
 * 스마트 요약 Action (이중 보안)
 */
export const smartSummaryAction = withActionTransactionAuth(
  SmartSummaryRequestSchema,
  'smartSummaryAction',
  smartSummaryInternal,
  {
    getLogMetadata: req => ({
      actionTransactionId: req.actionTransactionId,
      blockId: req.blockId,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 * - 이중 보안 완료 (actionTransactionId + blockId)
 * - Transaction 상태 검증 완료
 * - Block 권한 및 타입 검증 완료
 */
async function smartSummaryInternal(
  safeDto: SmartSummaryRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<SmartSummaryDTO>> {
  try {
    const transactionRepository = new DrizzleActionTransactionRepository();
    const videoRepository = new DrizzleVideoRepository();

    // 1. Transaction Aggregate 조회 (이미 검증됨)
    const transactionAggregate = await transactionRepository.findById(
      safeDto.actionTransactionId
    );

    if (!transactionAggregate) {
      return err('Transaction not found', { code: 'TRANSACTION_NOT_FOUND' });
    }

    const transaction = transactionAggregate.getTransaction();

    // 2. Video 조회
    const videoAggregate = await videoRepository.findById(
      transaction.videoId.value
    );

    if (!videoAggregate) {
      return err('Video not found', { code: 'VIDEO_NOT_FOUND' });
    }

    const video = videoAggregate.getVideo();

    // 3. Script 확인
    if (!video.script) {
      return err('Script not found. Please extract script first.', {
        code: 'SCRIPT_NOT_FOUND',
      });
    }

    // 4. Summary 생성 (AI Service)
    // TODO: 실제 AI Service 구현 필요
    // const summary = await aiService.generateSummary(video.script);
    // 임시로 더미 데이터 반환
    const summary = `Summary for video: ${video.title}\n\nThis is a placeholder summary. AI service integration needed.`;

    // 5. Transaction 완료 처리 (Command 패턴)
    const completeCommand: CompleteActionTransactionCommand = {
      transactionId: transaction.id.value,
    };
    transactionAggregate.complete(completeCommand);

    // 6. Aggregate 저장 (트랜잭션)
    await transactionRepository.update(transactionAggregate);

    // 7. 도메인 이벤트 처리
    const uncommittedEvents = transactionAggregate.getUncommittedEvents();
    await Promise.allSettled(uncommittedEvents.map(event => event.handle()));

    // 8. 이벤트 커밋
    transactionAggregate.markEventsAsCommitted();

    const response: SmartSummaryDTO = {
      summary,
      tokens: 1500, // TODO: 실제 토큰 수 계산 (Response에만 포함)
    };

    return ok(response);
  } catch (error) {
    console.error('[smartSummaryInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
