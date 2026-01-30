/**
 * Canvas 관련 Request 타입들 (Server Actions 입력)
 */

import { z } from 'zod';

import type { Position } from '../../types';

/**
 * 캔버스 뷰 조회 요청 (secure action 입력)
 * pageId만 전달하고, orgId/workspaceId는 authorizeByPageId로 검증된 context에서 사용
 */
export const GetCanvasViewRequestSchema = z.object({
  pageId: z.string().min(1, 'Page ID is required'),
});
export type GetCanvasViewRequest = z.infer<typeof GetCanvasViewRequestSchema>;

/**
 * 캔버스 초기화 요청
 */
export interface InitializeCanvasRequest {
  pageId: string;
}

/**
 * 뷰포트 업데이트 요청
 */
export interface UpdateViewportRequest {
  pageId: string;
  zoomLevel?: number;
  center?: Position;
}
