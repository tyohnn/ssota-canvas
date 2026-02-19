/**
 * Block Tab Options
 *
 * 블록 타입별 탭 옵션 타입 정의
 * 각 블록 타입의 탭별로 전달할 수 있는 옵션을 타입 안전하게 정의
 */

import { BlockType } from '@/domains/block-management/shared/types/block-types';

/**
 * YouTube 블록의 탭별 옵션
 */
export interface YoutubeTabOptions {
  summary: {
    language?: string;
    /** 액션에서 탭을 연 뒤 요약 추출 중일 때 true. Summary Section에서 로딩 표시용 */
    isExtracting?: boolean;
  };
  timeline: {
    scrollToTimestamp?: number;
  };
  note: {
    scrollToSection?: string;
  };
  metadata: Record<string, never>;
}

/**
 * Link 블록의 탭별 옵션
 */
export interface LinkTabOptions {
  summary: {
    language?: string;
    isExtracting?: boolean;
  };
  note: Record<string, never>;
  extract: Record<string, never>;
}

/**
 * 블록 타입별 탭 옵션 맵
 */
export interface BlockTabOptionsMap {
  [BlockType.YOUTUBE]: YoutubeTabOptions;
  [BlockType.LINK]: LinkTabOptions;
}
