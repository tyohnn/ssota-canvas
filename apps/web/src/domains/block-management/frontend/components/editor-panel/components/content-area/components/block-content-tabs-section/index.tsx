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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5050391a-baab-4666-90cd-e84fd838086c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c4aa21'},body:JSON.stringify({sessionId:'c4aa21',location:'block-content-tabs-section:no-blockType',message:'blockType is undefined - returning null',data:{blockId,hasBlockData:!!blockData},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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
