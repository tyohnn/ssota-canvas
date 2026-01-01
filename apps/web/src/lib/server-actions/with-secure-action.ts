import { z } from 'zod';

import { getAuthErrorMessage } from '@/domains/common/auth/error';
import {
  getAuthenticatedUser,
  verifyAccessByPageId,
} from '@/domains/common/auth/helpers';

import { ActionResult, err } from './result';
import type { ActionContext, SecureAction, SecureActionOptions } from './types';

/**
 * Higher-Order Function: Secure Action Wrapper
 *
 * Defense in Depth 보안 레이어를 자동으로 적용하는 HOF
 *
 * 적용되는 보안 레이어:
 * 1. Runtime Validation (Zod 스키마 검증)
 * 2. User Authentication (Supabase Auth)
 * 3. Access Control (Page-based permissions)
 *
 * @example
 * ```ts
 * export const createEdgeAction = withSecureAction(
 *   CreateEdgeRequestSchema,
 *   {
 *     getPageId: (req) => req.pageId,
 *     actionName: 'createEdgeAction',
 *   },
 *   createEdgeInternal
 * );
 * ```
 *
 * @param schema - Zod validation schema
 * @param options - Configuration options
 * @param handler - Internal business logic handler
 * @returns Secured server action
 */
export function withSecureAction<TRequest, TResponse>(
  schema: z.ZodSchema<TRequest>,
  options: SecureActionOptions<TRequest>,
  handler: (
    validatedRequest: TRequest,
    context: ActionContext
  ) => Promise<ActionResult<TResponse>>
): SecureAction<TRequest, TResponse> {
  return async (request: unknown): Promise<ActionResult<TResponse>> => {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🛡️ Layer 1: Runtime Validation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const parseResult = schema.safeParse(request);

    if (!parseResult.success) {
      console.warn(`[Security] Invalid request to ${options.actionName}`, {
        errors: parseResult.error.issues,
        timestamp: new Date().toISOString(),
      });

      return err('Invalid request data', {
        code: 'INVALID_REQUEST',
        meta: { errors: parseResult.error.issues },
      });
    }

    const validatedRequest = parseResult.data;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🛡️ Layer 2: Authentication & Authorization
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      // 2-1. 인증 확인
      const authenticatedUser = await getAuthenticatedUser();

      // 2-2. pageId 추출 (Direct or Indirect)
      const pageIdResult = await options.getPageId(validatedRequest);

      let pageId: string;
      if (typeof pageIdResult === 'string') {
        pageId = pageIdResult;
      } else {
        // Indirect 방식에서 Entity Not Found 처리
        if (!pageIdResult.pageId) {
          return err(pageIdResult.notFoundError || 'Resource not found', {
            code: 'RESOURCE_NOT_FOUND',
          });
        }
        pageId = pageIdResult.pageId;
      }

      // 2-3. 권한 확인
      const accessResult = await verifyAccessByPageId(
        pageId,
        authenticatedUser.id
      );

      if (!accessResult.success) {
        const logMetadata = options.getLogMetadata
          ? options.getLogMetadata(validatedRequest)
          : {};

        console.warn('[Security] Access denied', {
          userId: authenticatedUser.id,
          pageId,
          error: accessResult.error,
          ...logMetadata,
        });

        return err(getAuthErrorMessage(accessResult.error), {
          code: accessResult.error || 'ACCESS_DENIED',
        });
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ✅ All Security Checks Passed - Create Context & Execute Handler
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (!accessResult.workspace || !accessResult.page) {
        console.error(
          '[Security] Internal error: workspace or page not found in access result',
          {
            pageId,
            hasWorkspace: !!accessResult.workspace,
            hasPage: !!accessResult.page,
          }
        );
        return err('Internal server error', {
          code: 'INTERNAL_SERVER_ERROR',
        });
      }

      const context: ActionContext = {
        authenticatedUser,
        workspace: accessResult.workspace,
        page: accessResult.page,
      };

      return await handler(validatedRequest, context);
    } catch (error) {
      console.error(`[${options.actionName}] Authentication error:`, error);

      return err(
        error instanceof Error ? error.message : 'Authentication failed',
        {
          code: 'UNAUTHORIZED',
        }
      );
    }
  };
}
