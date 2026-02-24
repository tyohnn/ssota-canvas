import { z } from 'zod';

import { isRedirectError } from '@/utils/next-redirect';

import { ActionResult, err } from './result';
import type { SecureAction, SecureActionOptions } from './types';

/**
 * Higher-Order Function: Secure Action Wrapper (Project-Agnostic)
 *
 * Defense in Depth 보안 레이어를 자동으로 적용하는 HOF
 *
 * 적용되는 보안 레이어:
 * 1. Runtime Validation (Zod 스키마 검증)
 * 2. User Authentication (Project-specific)
 * 3. Access Control (Flexible authorization via authorize or legacy getPageId)
 *
 * ⚠️ This is a project-agnostic implementation
 * For project-specific usage, see @/domains/common/server-actions
 *
 * @param schema - Zod validation schema
 * @param options - Configuration options (supports both authorize and getPageId)
 * @param handler - Internal business logic handler
 * @returns Secured server action
 */
export function withSecureAction<
  TRequest,
  TResponse,
  TContext = unknown,
  TAuthenticatedUser = unknown,
  TBaseContext extends { authenticatedUser: TAuthenticatedUser } = {
    authenticatedUser: TAuthenticatedUser;
  },
>(
  schema: z.ZodSchema<TRequest>,
  options: SecureActionOptions<TRequest, TContext, TAuthenticatedUser>,
  handler: (
    validatedRequest: TRequest,
    context: TContext & TBaseContext
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
      // 2-1. 인증 확인 (Project-specific)
      const authenticatedUser = await options.getAuthenticatedUser();

      // 2-2. 권한 확인
      const authResult = await options.authorize(
        validatedRequest,
        authenticatedUser
      );

      if (!authResult.success || !authResult.context) {
        const logMetadata = options.getLogMetadata
          ? options.getLogMetadata(validatedRequest)
          : {};

        console.warn('[Security] Access denied', {
          userId: (authenticatedUser as any)?.id,
          error: authResult.error,
          ...logMetadata,
        });

        return err(authResult.error || 'Access denied', {
          code: 'ACCESS_DENIED',
        });
      }

      // Merge with authenticatedUser (always present)
      const context = {
        authenticatedUser,
        ...authResult.context,
      } as TContext & TBaseContext;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ✅ All Security Checks Passed - Execute Handler
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      return await handler(validatedRequest, context);
    } catch (error) {
      // redirect()/notFound()는 로깅 없이 rethrow (예상된 동작)
      if (isRedirectError(error)) {
        throw error;
      }

      // UNAUTHORIZED는 예상된 동작(미로그인)이므로 로깅 생략
      const message = error instanceof Error ? error.message : 'Authentication failed';
      const isExpectedAuthError =
        message?.includes('UNAUTHORIZED') || message?.includes('not authenticated');

      if (!isExpectedAuthError) {
        console.error(`[${options.actionName}] Authentication error:`, error);
      }

      return err(message, {
        code: 'UNAUTHORIZED',
      });
    }
  };
}
