import type { ActionResult } from './result';

/**
 * Server Actions 보안 및 미들웨어 관련 타입 정의
 *
 * ⚠️ Project-Agnostic Types
 * These types are generic and don't depend on specific domain models.
 * For project-specific context types, see @/domains/common/auth/types
 */

/**
 * Project-specific authentication function
 * Returns the authenticated user for the current request
 *
 * @template TAuthenticatedUser - Authenticated user type (project-specific)
 */
export type GetAuthenticatedUserFunction<TAuthenticatedUser> =
  () => Promise<TAuthenticatedUser>;

/**
 * Generic authorize function - returns custom context type
 * Allows each action to define its own authorization logic and context shape
 *
 * @template TRequest - Request type
 * @template TContext - Context type returned by authorization
 * @template TAuthenticatedUser - Authenticated user type (project-specific)
 */
export type AuthorizeFunction<
  TRequest,
  TContext,
  TAuthenticatedUser = unknown,
> = (
  request: TRequest,
  authenticatedUser: TAuthenticatedUser
) => Promise<AuthorizeResult<TContext>>;

/**
 * Authorization result with dynamic context type
 */
export interface AuthorizeResult<TContext> {
  success: boolean;
  error?: string;
  context?: TContext;
}

/**
 * 로그 메타데이터 추출 함수 타입
 */
export type MetadataExtractor<TRequest> = (
  request: TRequest
) => Record<string, unknown>;

/**
 * Rate Limiting 설정
 */
export interface RateLimitConfig {
  max: number;
  windowMs: number;
  keyExtractor?: <TRequest>(req: TRequest) => string;
}

/**
 * 캐싱 설정
 */
export interface CacheConfig {
  ttl: number;
  key: <TRequest>(req: TRequest) => string;
}

/**
 * SecureAction 옵션 (Generic version)
 */
export interface SecureActionOptions<
  TRequest,
  TContext = unknown,
  TAuthenticatedUser = unknown,
> {
  /**
   * Project-specific authentication function (Required)
   * Returns the authenticated user for the current request
   */
  getAuthenticatedUser: GetAuthenticatedUserFunction<TAuthenticatedUser>;

  /**
   * Authorization function (Required)
   * Allows custom authorization logic and returns custom context type
   * Each action can define what resources to verify and what context to return
   */
  authorize: AuthorizeFunction<TRequest, TContext, TAuthenticatedUser>;

  /**
   * Action 이름 (로깅용)
   */
  actionName: string;

  /**
   * 추가 로그 메타데이터 추출 (선택사항)
   */
  getLogMetadata?: MetadataExtractor<TRequest>;

  /**
   * Rate Limiting 설정 (선택사항)
   */
  rateLimit?: RateLimitConfig;

  /**
   * 감사 로그 활성화 (선택사항)
   */
  auditLog?: boolean;

  /**
   * 응답 캐싱 설정 (선택사항)
   */
  cache?: CacheConfig;
}

/**
 * SecureAction 함수 타입
 */
export type SecureAction<TRequest, TResponse> = (
  request: unknown
) => Promise<ActionResult<TResponse>>;

/**
 * withSecureAction function signature with generic context support
 *
 * @template TRequest - Request type
 * @template TResponse - Response type
 * @template TContext - Context type (project-specific)
 * @template TAuthenticatedUser - Authenticated user type (project-specific)
 * @template TBaseContext - Base context type that includes authenticated user (project-specific)
 */
export type WithSecureActionFunction = <
  TRequest,
  TResponse,
  TContext = unknown,
  TAuthenticatedUser = unknown,
  TBaseContext = { authenticatedUser: TAuthenticatedUser },
>(
  schema: import('zod').ZodSchema<TRequest>,
  options: SecureActionOptions<TRequest, TContext, TAuthenticatedUser>,
  handler: (
    validatedRequest: TRequest,
    context: TContext & TBaseContext
  ) => Promise<ActionResult<TResponse>>
) => SecureAction<TRequest, TResponse>;
