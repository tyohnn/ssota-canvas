'use client';

import React from 'react';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { ImageSpaceProvider } from './core/provider';
import { ImageSpaceDialog } from './components/dialog-content';

/**
 * Image Space Props
 */
export interface ImageSpaceProps {
  blockId: string;
  blockData: BlockNodeData;
}

/**
 * Image Space Container Props
 */
interface ImageSpaceContainerProps {
  blockId: string;
  blockData: BlockNodeData;
  children: React.ReactNode;
}

/**
 * Image Space Container (Provider + Dialog)
 *
 * Toolbar 레벨에서 사용하여 Trigger와 Dialog를 연결
 *
 * 사용법:
 * ```tsx
 * <ImageSpaceContainer blockId={blockId} blockData={blockData}>
 *   <ImageSpaceTrigger /> // Toolbar에 버튼 표시
 * </ImageSpaceContainer>
 * ```
 */
export function ImageSpaceContainer({
  blockId,
  blockData,
  children,
}: ImageSpaceContainerProps): React.ReactElement {
  return (
    <ImageSpaceProvider blockId={blockId} blockData={blockData}>
      {children}
      {/* Dialog는 Portal을 통해 body에 렌더링 */}
      <ImageSpaceDialog />
    </ImageSpaceProvider>
  );
}

// 개별 컴포넌트 export
export {
  ImageSpaceExploreTrigger,
  ImageSpaceEditorTrigger,
} from './components/trigger';
