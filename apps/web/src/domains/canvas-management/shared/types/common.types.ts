/**
 * Canvas Management Domain - 공통 타입 정의
 */

/**
 * 기본 위치 정보
 */
export type Position = {
  x: number;
  y: number;
};

/**
 * 기본 크기 정보
 */
export type Size = {
  width: number;
  height: number;
};

export type AlignmentType =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'center'
  | 'middle';

export type DistributionDirection = 'horizontal' | 'vertical';

/**
 * 기본 엣지 스타일
 */
export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
}

/**
 * React Flow Edge의 data 속성 타입
 */
export interface EdgeData extends Record<string, unknown> {
  edgeId: string;
  actualEdgeShape: EdgeShape;
  pageId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type EdgeShape =
  | 'default'
  | 'straight'
  | 'step'
  | 'smoothstep'
  | 'simplebezier';

export type EdgeHandle = 'left' | 'right' | 'top' | 'bottom';

/**
 * 기본 뷰포트 정보
 */
export interface ViewportInfo {
  x: number;
  y: number;
  zoom: number;
}
