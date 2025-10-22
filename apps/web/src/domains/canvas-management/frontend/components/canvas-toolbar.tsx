'use client';

import React, { useRef } from 'react';
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
import { cn } from '@/lib/utils';

// Canvas Management Hooks
import { useCanvasMode } from '../hooks/use-canvas-mode';
import { usePreventPinchZoom } from '../hooks/use-prevent-pinch-zoom';

export interface CanvasToolbarProps {
  pageId: string;
  onAddBlockClick?: () => void;
}

export function CanvasToolbar({ pageId, onAddBlockClick }: CanvasToolbarProps) {
  const reactFlow = useReactFlow();
  const canvasMode = useCanvasMode();
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 트랙패드 핀치 줌 방지
  usePreventPinchZoom(toolbarRef);

  // 현재 모드 상태 확인
  const isBlockCreationMode = canvasMode.isBlockCreationMode();
  const currentMode = canvasMode.getCurrentMode();

  // Fit to View 함수
  const handleFitToView = React.useCallback(() => {
    reactFlow.fitView({ duration: 200, padding: 0.1 });
  }, [reactFlow]);

  // 블록 추가 다이얼로그 열기
  const handleAddBlock = React.useCallback(() => {
    onAddBlockClick?.();
  }, [onAddBlockClick]);

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
    <div className="mt-4">
      <div
        ref={toolbarRef}
        className="flex items-center gap-1 px-2 py-1.5 bg-background/95 backdrop-blur-sm border border-border/30 rounded-md shadow-lg"
      >
        <TooltipProvider>
          {/* Selection Tool - 항상 활성화 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
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
                className="h-8 w-8 p-0 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
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
            className="mx-1 data-[orientation=vertical]:h-4 bg-border/50"
          />

          {/* Fit to View Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFitToView}
                className="h-8 w-8 p-0 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
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
            className="mx-1 data-[orientation=vertical]:h-4 bg-border/50"
          />

          {/* Add Block Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isBlockCreationMode ? 'default' : 'ghost'}
                size="sm"
                onClick={handleAddBlock}
                className={cn(
                  'h-8 w-8 p-0 rounded-sm transition-colors',
                  isBlockCreationMode
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
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
