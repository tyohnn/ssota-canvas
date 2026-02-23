/**
 * Image Toolbar Items
 *
 * 이미지 블록 툴바 아이템들
 *
 */
import React from 'react';

import { Separator } from '@/components/ui/separator';
import { ImageChangeToolbarItem } from './components/image-change-toolbar-item';
import { ImageToolbarProvider } from './core/provider';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
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
  const { readonly } = useCanvasReadOnly();

  return (
    <>
      <ImageToolbarProvider {...props}>
        {/* <ImageSpaceContainer blockId={blockId} blockData={blockData}>
          <ImageSpaceExploreTrigger />
          <ImageSpaceEditorTrigger />
        </ImageSpaceContainer> */}
        {/* readonly 모드에서는 ImageChangeToolbarItem 숨김 */}
        {!readonly && <ImageChangeToolbarItem />}
        {/* <ObjectFitToolbarItem /> */}
        {/* <CaptionVisibilityToolbarItem /> */}
        {/* <ExpandImageToolbarItem /> */}
      </ImageToolbarProvider>
      {!readonly && <Separator orientation="vertical" className="h-6!" />}
    </>
  );
}
