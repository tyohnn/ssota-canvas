// apps/web/src/domains/canvas-management/backend/services/interfaces/common.types.ts

/**
 * Canvas Management Service 공통 타입
 */

import type { CanvasViewData } from '../../../shared/dtos';

/**
 * Result type for Service responses
 *
 * @utils/result의 Result와 호환
 */
export type ServiceResult<T, E = Error> =
  | { success: true; value: T; isError: () => false }
  | { success: false; error: E; isError: () => true };

/**
 * Canvas View Result
 *
 * 캔버스 뷰 데이터 조회 결과
 */
export type CanvasViewResult = ServiceResult<CanvasViewData, Error>;
