/**
 * Canvas Management Domain - 공통 타입 정의
 */

/**
 * 기본 위치 정보
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 기본 크기 정보
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 기본 엣지 스타일
 */
export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
}

/**
 * 기본 뷰포트 정보
 */
export interface ViewportInfo {
  x: number;
  y: number;
  zoom: number;
}
