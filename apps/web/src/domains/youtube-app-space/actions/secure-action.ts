/**
 * YouTube App Space - Common Action Utilities
 *
 * YouTube 도메인 전용 Server Action wrapper와 유틸리티들
 */
import {
  authorizeByWorkspaceId,
  getAuthenticatedUser,
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import { AuthorizeResult } from '@/lib/server-actions/types';

import { DrizzleBlockRepository } from '../../block-management/backend/repositories/implementations/drizzle-block.repository';
import { BlockId } from '../../block-management/shared/value-objects/block-id.vo';
import { DrizzleActionTransactionRepository } from '../backend/repositories/implementations/drizzle-action-transaction.repository';

/**
 * YouTube 전용 Secure Action Builder
 */
const youtubeSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * Block-based authorization for YouTube actions
 *
 * blockId로 YouTube 블록 권한 검증
 * 1. Block 조회 (권한 검증)
 * 2. 블록 타입 검증 (YouTube 전용)
 * 3. Workspace 권한 검증
 *
 * Returns WorkspaceActionContext
 */
async function authorizeYoutubeBlockById(
  blockId: string,
  userId: string
): Promise<AuthorizeResult<WorkspaceActionContext>> {
  // 1. Block 조회 (권한 검증)
  const blockRepository = new DrizzleBlockRepository();
  const block = await blockRepository.findById(new BlockId(blockId));

  if (!block) {
    return { success: false, error: 'Block not found' };
  }

  // 2. 블록 타입 검증 (YouTube 전용)
  if (block.blockType.value !== 'youtube') {
    return { success: false, error: 'Block type must be youtube' };
  }

  // 3. Workspace 권한 검증
  return await authorizeByWorkspaceId(block.workspaceId.value, userId);
}

/**
 * YouTube Block 전용 secure action wrapper
 *
 * blockId 기반으로 YouTube 블록 액션에 사용합니다.
 * 자동으로 다음을 검증합니다:
 * 1. 사용자 인증
 * 2. Workspace 접근 권한
 * 3. Block 소유권 및 타입 (YouTube 블록인지 확인)
 *
 * @example
 * ```ts
 * export const getYoutubeMetadataAction = withYoutubeBlockSecureAction(
 *   GetYoutubeMetadataRequestSchema,
 *   'getYoutubeMetadataAction',
 *   async (req, ctx) => {
 *     // ctx는 WorkspaceActionContext
 *     // req.blockId가 YouTube 블록이고 ctx.workspace에 속함이 검증됨
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withYoutubeBlockSecureAction = youtubeSecureActionBuilder
  .forContext<WorkspaceActionContext>()
  .withAuth((req: { blockId: string }, user: AuthenticatedUser) =>
    authorizeYoutubeBlockById(req.blockId, user.id)
  )
  .build();

/**
 * Action Transaction based authorization (Double Security)
 *
 * actionTransactionId + blockId 이중 보안 검증
 * 1. Transaction 조회
 * 2. Transaction-Block 일치 확인
 * 3. Transaction 상태 확인 (중복 실행 방지)
 * 4. Block 권한 확인 (재사용)
 *
 * Returns WorkspaceActionContext
 */
async function authorizeByActionTransaction(
  req: { actionTransactionId: string; blockId: string },
  userId: string
): Promise<AuthorizeResult<WorkspaceActionContext>> {
  // 1. Transaction Aggregate 조회 (Repository 사용)
  const transactionRepository = new DrizzleActionTransactionRepository();
  const transactionAggregate = await transactionRepository.findById(
    req.actionTransactionId
  );

  if (!transactionAggregate) {
    return { success: false, error: 'Transaction not found' };
  }

  const transaction = transactionAggregate.getTransaction();

  // 2. Transaction-Block 일치 확인
  if (transaction.blockId.value !== req.blockId) {
    return { success: false, error: 'Transaction-Block mismatch' };
  }

  // 3. Transaction 상태 확인 (중복 실행 방지)
  if (transaction.isCompleted()) {
    return { success: false, error: 'Transaction already completed' };
  }

  // 4. Block 권한 확인 (재사용)
  return await authorizeYoutubeBlockById(req.blockId, userId);
}

/**
 * Action Transaction 전용 secure action wrapper
 *
 * actionTransactionId + blockId 이중 보안으로 유료 액션에 사용합니다.
 * 자동으로 다음을 검증합니다:
 * 1. 사용자 인증
 * 2. Transaction 존재 및 Block 일치 확인
 * 3. Transaction 상태 확인 (중복 실행 방지)
 * 4. Block 권한 및 타입 검증
 *
 * @example
 * ```ts
 * export const smartSummaryAction = withActionTransactionAuth(
 *   SmartSummaryRequestSchema,
 *   'smartSummaryAction',
 *   async (req, ctx) => {
 *     // ctx는 WorkspaceActionContext
 *     // req.actionTransactionId와 req.blockId가 모두 검증됨
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withActionTransactionAuth = youtubeSecureActionBuilder
  .forContext<WorkspaceActionContext>()
  .withAuth(
    (
      req: { actionTransactionId: string; blockId: string },
      user: AuthenticatedUser
    ) => authorizeByActionTransaction(req, user.id)
  )
  .build();
