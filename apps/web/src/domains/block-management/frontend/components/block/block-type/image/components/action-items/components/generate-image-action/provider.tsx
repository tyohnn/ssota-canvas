/**
 * Generate Image Action Provider
 *
 * Context Provider + Radix Dialog 래퍼
 */

'use client';

import React from 'react';

import { Dialog } from '@workspace/ui/components/coss-ui/dialog';

import { GenerateImageActionContext } from './generate-image-action.context';
import type { GenerateImageBusinessLogic } from './types';
import { useGenerateImage } from './use-generate-image';

/**
 * Provider Props
 */
export interface GenerateImageActionProviderProps {
  /** 초기 블록 ID 목록 */
  blockIds: string[];

  /** 자식 컴포넌트 */
  children: React.ReactNode;
}

/**
 * Generate Image Action Provider
 *
 * Context + Radix Dialog 통합
 */
export function GenerateImageActionProvider({
  blockIds,
  children,
}: GenerateImageActionProviderProps): React.ReactElement {
  // 통합 Hook
  const generateImage = useGenerateImage({
    initialBlockIds: blockIds,
  });

  return (
    <GenerateImageActionContext.Provider value={generateImage}>
      <Dialog
        open={generateImage.open}
        onOpenChange={generateImage.handleOpenChange}
      >
        {children}
      </Dialog>
    </GenerateImageActionContext.Provider>
  );
}
