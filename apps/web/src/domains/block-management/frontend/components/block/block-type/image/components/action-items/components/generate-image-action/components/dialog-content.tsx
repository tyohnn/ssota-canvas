/**
 * Dialog Content Component
 *
 * Image Space 스타일 적용
 */

'use client';

import React from 'react';
import {
  DialogPopup as RadixDialogContent,
  DialogTitle,
} from '@workspace/ui/components/coss-ui/dialog';
import { cn } from '@workspace/ui/lib/utils';

/**
 * Dialog Content Props
 */
export interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Dialog Content Wrapper
 *
 * Image Space와 동일한 스타일 적용
 */
export function DialogContent({
  children,
  className,
}: DialogContentProps): React.ReactElement {
  return (
    <RadixDialogContent
      className={cn(
        'max-w-[40vw]! w-full h-[70vh] max-h-[80vh]! p-0 gap-0 overflow-hidden rounded-lg fixed! top-[50%]! left-[50%]! translate-x-[-50%]! translate-y-[-50%]! m-0!',
        className
      )}
      showCloseButton={true}
    >
      {/* 접근성을 위한 숨겨진 타이틀 */}
      <DialogTitle className="sr-only">Generate Image</DialogTitle>

      {children}
    </RadixDialogContent>
  );
}
