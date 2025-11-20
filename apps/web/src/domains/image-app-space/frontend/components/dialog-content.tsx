'use client';

import {
  Dialog,
  DialogPopup as DialogContent,
  DialogTitle,
} from '@workspace/ui/components/coss-ui/dialog';
import { useImageSpaceContext } from '../core/image-space.context';
import { ImageSpaceHeader } from './header';
import { ImageSpaceContentArea, ExploreTabMenu } from './content-area';

/**
 * Image Space Dialog
 *
 * Full-screen Dialog로 Space 전체를 감싸는 컨테이너
 */
export function ImageSpaceDialog() {
  const { open, handleOpenChange, activeTopMenu } = useImageSpaceContext();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[95vw]! w-full h-[90vh] max-h-[90vh]! p-0 gap-0 overflow-hidden rounded-lg fixed! top-[50%]! left-[50%]! translate-x-[-50%]! translate-y-[-50%]! m-0!"
        showCloseButton={true}
      >
        {/* 접근성을 위한 숨겨진 타이틀 */}
        <DialogTitle className="sr-only">Image Space</DialogTitle>

        {/* 전체 레이아웃 */}
        <div className="flex flex-col h-full min-h-0">
          {/* 상단 헤더 */}
          <ImageSpaceHeader />

          {/* Explore 탭 메뉴 (Explore 모드일 때만) */}
          {activeTopMenu === 'explore' && <ExploreTabMenu />}

          {/* 메인 컨텐츠 */}
          <ImageSpaceContentArea />
        </div>
      </DialogContent>
    </Dialog>
  );
}
