/**
 * Create Tab Options
 *
 * 타입 안전한 탭 옵션 생성 헬퍼 함수
 */

import type { BlockTabOptionsMap } from '../../types/block-tab-options';

/**
 * 타입 안전한 탭 옵션 생성 헬퍼
 *
 * @example
 * createTabOptions('youtube', 'summary', { language: 'ko' })
 * createTabOptions('youtube', 'script', { scrollToTimestamp: 120 })
 */
export function createTabOptions<
  B extends keyof BlockTabOptionsMap,
  T extends keyof BlockTabOptionsMap[B]
>(
  blockType: B,
  tabId: T,
  options?: BlockTabOptionsMap[B][T]
) {
  return {
    tab: tabId as string,
    tabOptions: options,
  };
}
