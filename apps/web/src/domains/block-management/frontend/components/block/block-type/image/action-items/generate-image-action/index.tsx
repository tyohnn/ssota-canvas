/**
 * Generate Image Action Component
 *
 * SSOTA Image Generation 액션
 *
 * Compound Component Pattern 적용
 * - Provider + 서브 컴포넌트 조합
 * - Context를 통한 상태 공유
 * - 노코드 친화적 Props 설계
 */

'use client';

import React from 'react';
import { Wand2, LucideIcon } from 'lucide-react';
import { GenerateImageActionProvider } from './provider';
import { Trigger } from './components/trigger';
import { DialogContent } from './components/dialog-content';
import { PromptInput } from './components/prompt-input';
import { OptionsBar } from './components/options-bar';
import { AspectRatioPreview } from './components/aspect-ratio-preview';
import { ResultGrid } from './components/result-grid';
import { SelectionPanel } from './components/selection-panel';
import type { GenerateImageActionProps } from './types';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * 범용 Generate Image Action Props
 */
export interface GenerateImageActionFullProps extends GenerateImageActionProps {
  orgId: string;
  workspaceId: string;

  /** 트리거 아이콘 */
  triggerIcon?: LucideIcon;

  /** 트리거 툴팁 */
  triggerTooltip?: string;
}

/**
 * Generate Image Action (범용 컴포넌트)
 *
 * Provider + Trigger + Dialog Content 조합
 *
 * @example
 * ```tsx
 * <GenerateImageAction
 *   blockIds={[blockId]}
 *   orgId={orgId}
 *   workspaceId={workspaceId}
 *   triggerIcon={Wand2}
 *   triggerTooltip="Generate image"
 * />
 * ```
 */
export function GenerateImageAction({
  blockIds,
  orgId,
  workspaceId,
  triggerIcon = Wand2,
  triggerTooltip = 'Generate image',
}: GenerateImageActionFullProps): React.ReactElement {
  return (
    <GenerateImageActionProvider
      blockIds={blockIds}
      orgId={orgId}
      workspaceId={workspaceId}
    >
      {/* Trigger */}
      <Trigger icon={triggerIcon} tooltip={triggerTooltip} />

      {/* Dialog Content */}
      <DialogContent>
        {/* 전체 레이아웃 - 스크롤 가능 */}
        <Box className="flex flex-col h-full min-h-0 overflow-y-auto">
          {/* Options Bar (모델, 비율, 개수, 생성 버튼) - 최상단 */}
          <OptionsBar />

          {/* Prompt Input (결과 없을 때) 또는 Selection Panel (결과 있을 때) */}
          <PromptInput />
          <SelectionPanel />

          {/* Aspect Ratio Preview (결과 없을 때) 또는 Result Grid (결과 있을 때) */}
          <AspectRatioPreview />
          <ResultGrid />
        </Box>
      </DialogContent>
    </GenerateImageActionProvider>
  );
}
