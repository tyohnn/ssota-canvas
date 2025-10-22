'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import { Label } from '@workspace/ui/components/ui/label';
import { Slider } from '@workspace/ui/components/ui/slider';
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
  const [zoomPercent, setZoomPercent] = useState(100);
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

  // 현재 줌 레벨을 퍼센트로 변환
  const updateZoomPercent = useCallback(() => {
    if (!isClient || !canvasViewport) return;
    const currentZoom = canvasViewport.getZoomLevel();
    setZoomPercent(Math.round(currentZoom * 100));
  }, [canvasViewport, isClient]);

  // 줌 레벨 변경 시 퍼센트 업데이트
  useEffect(() => {
    if (isClient) {
      updateZoomPercent();
    }
  }, [updateZoomPercent, isClient]);

  // 슬라이더로 줌 변경 (CM-003에서 활성화될 예정)
  const handleZoomChange = useCallback(
    (percent: number) => {
      const zoomLevel = percent / 100;
      if (isClient && canvasViewport?.reactFlow) {
        canvasViewport.reactFlow.zoomTo(zoomLevel, { duration: 200 });
      }
      setZoomPercent(percent);
    },
    [canvasViewport, isClient]
  );

  // 미니맵 토글
  const toggleMiniMap = useCallback(() => {
    setShowMiniMap(!showMiniMap);
  }, [showMiniMap]);

  // 클라이언트 사이드에서만 렌더링
  if (!isClient) {
    return null;
  }

  const zoomLevel = canvasViewport.getZoomLevel();
  const center = canvasViewport.getViewportCenter();

  return (
    <div
      ref={containerRef}
      className={`absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2 ${className}`}
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
        className="flex items-center gap-3 px-2 py-1.5 bg-background/95 backdrop-blur-sm border border-border/30 rounded-md shadow-lg"
        style={{ touchAction: 'none' }}
        onWheel={e => e.stopPropagation()}
      >
        {/* 줌 레벨 표시 (읽기 전용) */}
        <div className="flex items-center gap-2">
          <Label className="tabular-nums text-sm">
            {Math.round(zoomLevel * 100)}%
          </Label>
        </div>

        {/* 뷰포트 정보 (디버그용) */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {Math.round(center.x)}, {Math.round(center.y)}
          </span>
        </div>

        <TooltipProvider>
          {/* Zoom In */}
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

          {/* Zoom Out */}
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
