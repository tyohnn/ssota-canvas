/**
 * Generate Image Action Provider
 *
 * Context Provider + Radix Dialog 래퍼
 */

'use client';

import React from 'react';
import { Dialog } from '@workspace/ui/components/coss-ui/dialog';
import { GenerateImageActionContext } from './generate-image-action.context';
import { useGenerateImage } from './use-generate-image';
import type { GenerateImageBusinessLogic } from './types';

/**
 * Provider Props
 */
export interface GenerateImageActionProviderProps {
  /** 초기 블록 ID 목록 */
  blockIds: string[];

  /** 조직 ID */
  orgId: string;

  /** 워크스페이스 ID */
  workspaceId: string;

  /** 비즈니스 로직 (선택적, 테스트/Mock용) */
  businessLogic?: GenerateImageBusinessLogic;

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
  orgId,
  workspaceId,
  businessLogic,
  children,
}: GenerateImageActionProviderProps): React.ReactElement {
  // 통합 Hook
  const generateImage = useGenerateImage(
    blockIds,
    orgId,
    workspaceId,
    businessLogic
  );

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
