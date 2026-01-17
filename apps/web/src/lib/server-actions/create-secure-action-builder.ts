import type { z } from 'zod';

import type { ActionResult } from './result';
import type {
  AuthorizeFunction,
  AuthorizeResult,
  GetAuthenticatedUserFunction,
  SecureAction,
} from './types';
import { withSecureAction } from './with-secure-action';

/**
 * Secure Action Builder - Fluent Chaining API
 *
 * 프로젝트별 preset wrapper를 매우 쉽게 만들 수 있게 해주는 빌더
 * 체이닝 방식으로 직관적이고 읽기 쉬운 API 제공
 *
 * @example
 * ```ts
 * const builder = createSecureActionBuilder(getAuthenticatedUser);
 *
 * export const withPageSecureAction = builder
 *   .forContext<PageActionContext>()
 *   .withAuth((req: { pageId: string }, user) =>
 *     authorizeByPageId(req.pageId, user.id)
 *   )
 *   .build();
 * ```
 */
export function createSecureActionBuilder<TAuthenticatedUser>(
  getAuthenticatedUser: GetAuthenticatedUserFunction<TAuthenticatedUser>
) {
  return {
    /**
     * Context 타입 지정
     */
    forContext: <
      TContext,
      TBaseContext extends { authenticatedUser: TAuthenticatedUser } = {
        authenticatedUser: TAuthenticatedUser;
      },
    >() => {
      return {
        /**
         * Authorization 로직 지정
         */
        withAuth: (
          authorize: (
            req: any,
            user: TAuthenticatedUser
          ) => Promise<AuthorizeResult<TContext>>
        ) => {
          return {
            /**
             * 최종 wrapper 함수 생성
             */
            build: () => {
              return function <TRequest, TResponse>(
                schema: z.ZodSchema<TRequest>,
                actionName: string,
                handler: (
                  req: TRequest,
                  ctx: TContext & TBaseContext
                ) => Promise<ActionResult<TResponse>>,
                options?: {
                  getLogMetadata?: (req: TRequest) => Record<string, unknown>;
                }
              ): SecureAction<TRequest, TResponse> {
                // Create a properly typed authorize function
                const typedAuthorize: AuthorizeFunction<
                  TRequest,
                  TContext,
                  TAuthenticatedUser
                > = async (req, user) => {
                  return await authorize(req, user);
                };

                return withSecureAction<
                  TRequest,
                  TResponse,
                  TContext,
                  TAuthenticatedUser,
                  TBaseContext
                >(
                  schema,
                  {
                    getAuthenticatedUser,
                    authorize: typedAuthorize,
                    actionName,
                    ...options,
                  },
                  handler
                );
              };
            },
          };
        },
      };
    },
  };
}
