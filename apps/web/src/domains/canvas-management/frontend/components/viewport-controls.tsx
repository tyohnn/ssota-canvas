'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Map, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { MiniMap } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useCanvasViewport } from '../hooks/use-canvas-viewport';
import { usePreventPinchZoom } from '../hooks/use-prevent-pinch-zoom';

export interface ViewportControlsProps {
  className?: string;
}

/**
 * ViewportControls 컴포넌트
 *
 * 캔버스 뷰포트 조작을 위한 컨트롤 컴포넌트 (읽기 전용 버전)
 * canvas-view-toolbar.tsx 디자인 참고
 */
export function ViewportControls({ className = '' }: ViewportControlsProps) {
  const [isClient, setIsClient] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hook은 항상 호출해야 함 (Hook Rules)
  const canvasViewport = useCanvasViewport();

  // 트랙패드 핀치 줌 방지 (모든 영역에 적용)
  usePreventPinchZoom(toolbarRef);
  usePreventPinchZoom(minimapRef);
  usePreventPinchZoom(containerRef);

  // 클라이언트 사이드에서만 렌더링되도록 처리
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 미니맵 토글
  const toggleMiniMap = useCallback(() => {
    setShowMiniMap(!showMiniMap);
  }, [showMiniMap]);

  // 클라이언트 사이드에서만 렌더링
  if (!isClient) {
    return null;
  }

  const zoomLevel = canvasViewport.getZoomLevel();

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-end gap-2 ${className}`}
      style={{ touchAction: 'none' }}
      onWheel={e => e.stopPropagation()}
    >
      {/* MiniMap positioned above the toolbar */}
      {showMiniMap && (
        <div
          ref={minimapRef}
          className="w-48 h-32 bg-background/95 backdrop-blur-sm border border-border/30 rounded-md shadow-lg overflow-hidden"
          style={{ touchAction: 'none' }}
          onWheel={e => e.stopPropagation()}
        >
          <MiniMap />
        </div>
      )}

      {/* Zoom controls toolbar */}
      <div
        ref={toolbarRef}
        className="flex items-center gap-2 px-2 py-1.5 bg-background/95 backdrop-blur-sm border border-border/30 rounded-md shadow-lg"
        style={{ touchAction: 'none' }}
        onWheel={e => e.stopPropagation()}
      >
        <TooltipProvider>
          {/* Zoom Out (축소) - 왼쪽 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => canvasViewport.zoomOut()}
                aria-label="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">축소</TooltipContent>
          </Tooltip>

          {/* 줌 레벨 표시 - 중앙 */}
          <div className="flex items-center justify-center min-w-[3rem] px-1">
            <span className="text-xs tabular-nums font-medium">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>

          {/* Zoom In (확대) - 오른쪽 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => canvasViewport.zoomIn()}
                aria-label="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">확대</TooltipContent>
          </Tooltip>

          {/* Fit to Screen */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => canvasViewport.fitToScreen()}
                aria-label="Fit to Screen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">화면 맞춤</TooltipContent>
          </Tooltip>

          {/* MiniMap toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showMiniMap ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-8 w-8 p-0 rounded-sm transition-colors',
                  showMiniMap
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
                onClick={toggleMiniMap}
                aria-label="Toggle Minimap"
              >
                <Map className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">미니맵</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
