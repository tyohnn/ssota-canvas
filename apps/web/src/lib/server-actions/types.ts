import type { ActionResult } from './result';

/**
 * Server Actions 보안 및 미들웨어 관련 타입 정의
 */

/**
 * pageId 추출 함수 타입
 * - Direct: request에서 직접 추출 (예: req.pageId)
 * - Indirect: 비동기 조회로 추출 (예: Edge 조회 후 pageId 가져오기)
 */
export type PageIdExtractor<TRequest> = (
  request: TRequest
) => string | Promise<string | PageIdResult>;

/**
 * Indirect 방식의 pageId 추출 결과
 */
export interface PageIdResult {
  pageId: string;
  notFoundError?: string;
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
 * SecureAction 옵션
 */
export interface SecureActionOptions<TRequest> {
  /**
   * pageId 추출 함수
   * - Direct: request에서 직접 추출 (예: req.pageId)
   * - Indirect: 비동기 조회로 추출 (예: Edge 조회 후 pageId 가져오기)
   */
  getPageId: PageIdExtractor<TRequest>;

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
