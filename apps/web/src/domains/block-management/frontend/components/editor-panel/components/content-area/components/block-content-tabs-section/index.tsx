/**
 * Block Content Tabs Section
 *
 * 블록 타입별로 동적으로 탭을 로드하고 표시하는 컴포넌트
 * 탭이 없는 블록 타입은 NoteSection을 표시
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { BlockContentTabsSectionView } from './components/block-content-tabs-section.view';

export interface BlockContentTabsSectionProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

/**
 * Block Content Tabs Section Component
 *
 * 탭이 있는 블록 타입: 탭 UI 표시
 * 탭이 없는 블록 타입: NoteSection 표시
 */
export function BlockContentTabsSection({
  blockId,
  blockData,
}: BlockContentTabsSectionProps) {
  const blockType = blockData?.blockType;

  if (!blockType) {
    return null;
  }

  // 탭이 있는 블록 타입: 탭 UI 표시 (탭이 없으면 view에서 NoteSection 표시)
  return (
    <BlockContentTabsSectionView
      blockId={blockId}
      blockData={blockData}
      blockType={blockType}
    />
  );
}
