/**
 * Image Toolbar Items
 *
 * 이미지 블록 툴바 아이템들
 */

import React from 'react';
import { ImageToolbarProvider } from './core/provider';
import { ImageChangeToolbarItem } from './image-change-toolbar-item';
import { ObjectFitToolbarItem } from './object-fit-toolbar-item';
import { CaptionVisibilityToolbarItem } from './caption-visibility-toolbar-item';
import { ExpandImageToolbarItem } from './expand-image-toolbar-item';
import {
  ImageSpaceContainer,
  ImageSpaceExploreTrigger,
  ImageSpaceEditorTrigger,
} from '@/domains/image-app-space/frontend';
import { Separator } from '@workspace/ui/components/ui/separator';
import type { ImageToolbarItemsProps } from './core/types';

/**
 * Image Toolbar Items Component
 *
 * Provider + 서브 컴포넌트 조합
 *
 * Context 패턴:
 * - Props Drilling 제거
 * - 자식 컴포넌트가 Context에서 데이터 가져오기
 * - 코드 간결화 및 유지보수성 향상
 */
export function ImageToolbarItems(props: ImageToolbarItemsProps) {
  const { blockId, blockData } = props;

  return (
    <ImageToolbarProvider {...props}>
      <ImageSpaceContainer blockId={blockId} blockData={blockData}>
        <ImageSpaceExploreTrigger />
        <ImageSpaceEditorTrigger />
      </ImageSpaceContainer>
      <ImageChangeToolbarItem />
      <ObjectFitToolbarItem />
      <Separator orientation="vertical" className="h-6" />
      <CaptionVisibilityToolbarItem />
      <ExpandImageToolbarItem />
    </ImageToolbarProvider>
  );
}
