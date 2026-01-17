/**
 * Use Table of Contents Hook
 *
 * 목차 컴포넌트의 메인 훅으로 UI 상태와 활성 시간을 오케스트레이션합니다.
 */

'use client';

import { useCallback } from 'react';

import { type TOCItem, generateMinuteTOC } from '../../../core/utils';
import type { UseTableOfContentsResult } from './types';
import { useActiveTime } from './use-active-time';
import { useTableOfContentsUI } from './use-table-of-contents.ui';

/**
 * Use Table of Contents Hook
 *
 * @param transcript - 스크립트 세그먼트 배열
 * @param showTOC - 목차 표시 여부
 * @returns 목차 관련 상태 및 핸들러
 */
export function useTableOfContents(
  transcript: Array<{ start: number; text: string }> | undefined,
  showTOC: boolean
): UseTableOfContentsResult {
  const allTocItems = generateMinuteTOC(transcript);
  const { isHovered, setIsHovered } = useTableOfContentsUI();
  const { activeTime } = useActiveTime(transcript, showTOC);

  // 최대 20개까지만 표시
  const tocItems = allTocItems.slice(0, 20);

  // activeTime에 해당하는 목차 항목 찾기
  const getActiveTOCItem = useCallback(
    (item: TOCItem): boolean => {
      if (activeTime === null) {
        return false;
      }
      // 해당 목차 항목의 시간 범위 내에 있는지 확인
      const nextItem = allTocItems.find(t => t.startTime > item.startTime);
      const endTime = nextItem ? nextItem.startTime : Infinity;
      return activeTime >= item.startTime && activeTime < endTime;
    },
    [activeTime, allTocItems]
  );

  const handleTOCClick = useCallback(
    (item: TOCItem) => {
      // 해당 구간의 첫 번째 segment 찾기
      const targetElement = document.querySelector(
        `[data-segment-time="${item.startTime}"]`
      );

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    },
    []
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, [setIsHovered]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, [setIsHovered]);

  return {
    allTocItems,
    tocItems,
    isHovered,
    activeTime,
    getActiveTOCItem,
    handleTOCClick,
    handleMouseEnter,
    handleMouseLeave,
  };
}
