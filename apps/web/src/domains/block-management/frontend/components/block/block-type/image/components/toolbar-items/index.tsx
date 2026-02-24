/**
 * Image Toolbar Items
 *
 * 이미지 블록 툴바 아이템들
 *
 */
import React from 'react';

// import { Separator } from '@/components/ui/separator';
// import { ImageChangeToolbarItem } from './components/image-change-toolbar-item';
import { ImageToolbarProvider } from './core/provider';
// import { ObjectFitToolbarItem } from './object-fit-toolbar-item';
// import { CaptionVisibilityToolbarItem } from './caption-visibility-toolbar-item';
// import { ExpandImageToolbarItem } from './expand-image-toolbar-item';
// import {
//   ImageSpaceContainer,
//   ImageSpaceExploreTrigger,
//   ImageSpaceEditorTrigger,
// } from '@/domains/image-app-space/frontend';
// import { Separator } from '@workspace/ui/components/ui/separator';
import type { ImageToolbarItemsProps } from './core/types';

/**
 * Image Toolbar Items Component
 *
 * Provider + 서브 컴포넌트 조합
 *
 */
export function ImageToolbarItems(props: ImageToolbarItemsProps) {
  return (
    <>
      <ImageToolbarProvider {...props}>
        {/* 액션 툴바 아이템 주석처리 */}
        {null}
      </ImageToolbarProvider>
      {/* change image 제거로 Separator도 숨김 */}
      {/* {!readonly && <Separator orientation="vertical" className="h-6!" />} */}
    </>
  );
}
