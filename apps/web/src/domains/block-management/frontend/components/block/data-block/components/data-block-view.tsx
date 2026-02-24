/**
 * DataBlock View Component
 *
 * View Mode에 따라 적절한 View를 렌더링하는 Presentational Component
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockViewModeValue } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';

import { CardView } from './card-view';
import { NoteView } from './note-view';
import { OriginalView } from './original-view';

export interface DataBlockViewProps {
  viewMode: BlockViewModeValue;
  data: BlockNodeData;
  renderOriginalView?: () => React.ReactNode;
  renderCardView?: () => React.ReactNode;
  selected?: boolean; // 선택 상태 (NoteView 스타일링용)
}

export function DataBlockView({
  viewMode,
  data,
  renderOriginalView,
  renderCardView,
  selected = false,
}: DataBlockViewProps) {
  switch (viewMode) {
    case 'note':
      return <NoteView data={data} selected={selected} />;
    case 'original':
      if (!renderOriginalView) {
        throw new Error(
          `[DataBlockView] renderOriginalView is required for viewMode 'original'`
        );
      }
      return (
        <OriginalView
          selected={selected}
          noContainerBoundary={data.noContainerBoundary}
        >
          {renderOriginalView()}
        </OriginalView>
      );
    case 'card':
      if (!renderCardView) {
        throw new Error(
          `[DataBlockView] renderCardView is required for viewMode 'card'`
        );
      }
      return renderCardView();
    default:
      // default는 original로 처리
      if (!renderOriginalView) {
        throw new Error(
          `[DataBlockView] renderOriginalView is required for viewMode '${viewMode}'`
        );
      }
      return (
        <OriginalView
          selected={selected}
          noContainerBoundary={data.noContainerBoundary}
        >
          {renderOriginalView()}
        </OriginalView>
      );
  }
}
