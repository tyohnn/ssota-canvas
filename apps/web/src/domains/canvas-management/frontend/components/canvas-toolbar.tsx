'use client';

import React from 'react';
import { useReactFlow } from '@xyflow/react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Separator } from '@workspace/ui/components/ui/separator';
import { Plus, MousePointer, Hand, Maximize } from 'lucide-react';

// Canvas Management Hooks
import { useCanvasMode } from '../hooks/use-canvas-mode';

export interface CanvasToolbarProps {
  pageId: string;
}

export function CanvasToolbar({ pageId }: CanvasToolbarProps) {
  const reactFlow = useReactFlow();
  const canvasMode = useCanvasMode();

  // 현재 모드 상태 확인
  const isBlockCreationMode = canvasMode.isBlockCreationMode();
  const currentMode = canvasMode.getCurrentMode();

  // Fit to View 함수
  const handleFitToView = React.useCallback(() => {
    reactFlow.fitView({ duration: 200, padding: 0.1 });
  }, [reactFlow]);

  // 블록 생성 모드 진입 (CM-002에서 구현될 예정)
  const handleAddBlock = React.useCallback(() => {
    // TODO: CM-002에서 BlockAddDialog와 연동
    console.log('Add block clicked for page:', pageId);
  }, [pageId]);

  // Keyboard event handler
  const handleKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      // Only handle if not typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }

      // Ignore system shortcuts but allow Shift
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      switch (event.code) {
        case 'KeyF':
          event.preventDefault();
          event.stopPropagation();
          handleFitToView();
          break;
        case 'Escape':
          // 기본 모드로 복귀
          if (currentMode.type !== 'default') {
            event.preventDefault();
            event.stopPropagation();
            canvasMode.exitToDefaultMode();
          }
          break;
      }
    },
    [handleFitToView, canvasMode, currentMode]
  );

  React.useEffect(() => {
    const handleKeyDownWrapper = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };

    // Use capture phase to ensure we get the event before React Flow
    document.addEventListener('keydown', handleKeyDownWrapper, true);
    return () =>
      document.removeEventListener('keydown', handleKeyDownWrapper, true);
  }, [handleKeyDown]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-1 px-2 py-1 bg-background/70 backdrop-blur-md border border-border/50 rounded-lg shadow-xl">
        <TooltipProvider>
          {/* Selection Tool - 항상 활성화 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-md"
                onClick={canvasMode.exitToDefaultMode}
              >
                <MousePointer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Select</p>
            </TooltipContent>
          </Tooltip>

          {/* Hand Tool - 패닝 모드 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-md"
                onClick={() => {
                  // Hand tool은 React Flow 내장 기능 활용
                  console.log('Hand tool activated');
                }}
              >
                <Hand className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Hand</p>
            </TooltipContent>
          </Tooltip>

          <Separator
            orientation="vertical"
            className="mx-1 data-[orientation=vertical]:h-4"
          />

          {/* Fit to View Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFitToView}
                className="h-8 w-8 p-0 rounded-md"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Fit to View (F)</p>
            </TooltipContent>
          </Tooltip>

          <Separator
            orientation="vertical"
            className="mx-1 data-[orientation=vertical]:h-4"
          />

          {/* Add Block Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isBlockCreationMode ? 'default' : 'ghost'}
                size="sm"
                onClick={handleAddBlock}
                className="h-8 w-8 p-0 rounded-md"
                disabled={isBlockCreationMode}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Add Block</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
