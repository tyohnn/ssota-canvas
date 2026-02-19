/**
 * Script Table of Contents
 *
 * 스크립트의 5분/10분 간격 목차 컴포넌트
 * - 기본: 수평선 형태의 목차 요약
 * - 호버: 전체 영역에 흰색 배경 카드 표시
 * - 클릭: 해당 구간으로 스크롤
 */

'use client';

import { Box } from '@/components/ui/box';

import { generateMinuteTOC } from '../../core/utils';
import { TOCCard } from './components/toc-card';
import { TOCLines } from './components/toc-lines';
import type { ScriptTableOfContentsProps } from './core/types';
import { useTableOfContents } from './core/use-table-of-contents';

/**
 * Script Table of Contents Component
 */
export function ScriptTableOfContents({
  transcript,
  showTOC,
}: ScriptTableOfContentsProps) {
  // 모든 hooks는 early return 전에 호출되어야 함
  const {
    tocItems,
    isHovered,
    getActiveTOCItem,
    handleTOCClick,
    handleMouseEnter,
    handleMouseLeave,
    allTocItems: allItems,
  } = useTableOfContents(transcript, showTOC);

  const allTocItems = generateMinuteTOC(transcript);

  // 스크립트가 1분 미만이거나 목차 항목이 없으면 표시하지 않음
  if (allTocItems.length <= 1 || !showTOC) {
    return null;
  }

  return (
    <Box
      className="fixed right-4 top-1/2 -translate-y-1/2 z-[70] transition-opacity duration-300"
      style={{
        opacity: showTOC ? 1 : 0,
        pointerEvents: showTOC ? 'auto' : 'none',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box className="relative">
        <TOCLines
          tocItems={tocItems}
          isHovered={isHovered}
          getActiveTOCItem={getActiveTOCItem}
          onItemClick={handleTOCClick}
        />

        {isHovered ? (
          <TOCCard
            allTocItems={allItems}
            getActiveTOCItem={getActiveTOCItem}
            onItemClick={handleTOCClick}
          />
        ) : null}
      </Box>
    </Box>
  );
}
