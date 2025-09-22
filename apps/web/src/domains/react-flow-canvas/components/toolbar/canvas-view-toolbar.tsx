"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { Button } from "@workspace/ui/components/ui/button";
import { Label } from "@workspace/ui/components/ui/label";
import { Slider } from "@workspace/ui/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";
import { Map, Bug } from "lucide-react";
import { MiniMap } from "@xyflow/react";
import { usePanel } from "@/domains/react-flow-canvas/contexts/PanelContext";
import { useControlState, useControlCommands } from "@/domains/react-flow-canvas/contexts/ControlContext";

export function CanvasViewToolbar() {
  const reactFlow = useReactFlow();
  const { showMiniMap } = useControlState();
  const { setShowMiniMap } = useControlCommands();
  const { showDebugPanel, openDebugPanel, closeDebugPanel } = usePanel();
  
  const [zoomPercent, setZoomPercent] = useState(100);

  // 현재 줌 레벨을 퍼센트로 변환
  const updateZoomPercent = useCallback(() => {
    const currentZoom = reactFlow.getZoom();
    setZoomPercent(Math.round(currentZoom * 100));
  }, [reactFlow]);

  // 줌 레벨 변경 시 퍼센트 업데이트
  useEffect(() => {
    updateZoomPercent();
  }, [updateZoomPercent]);

  // 슬라이더로 줌 변경
  const handleZoomChange = useCallback((percent: number) => {
    const zoomLevel = percent / 100;
    reactFlow.zoomTo(zoomLevel, { duration: 200 });
    setZoomPercent(percent);
  }, [reactFlow]);

  // 미니맵 토글
  const toggleMiniMap = useCallback(() => {
    setShowMiniMap(!showMiniMap);
  }, [showMiniMap, setShowMiniMap]);

  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
      {/* MiniMap positioned above the toolbar */}
      {showMiniMap && (
        <div className="w-48 h-32 bg-background/70 backdrop-blur-md border border-border/50 rounded-lg shadow-xl overflow-hidden">
          <MiniMap />
        </div>
      )}

      {/* Zoom controls toolbar */}
      <div className="flex items-center gap-3 px-2 py-1 bg-background/70 backdrop-blur-md border border-border/50 rounded-lg shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-32">
            <Slider
              className="grow"
              value={[zoomPercent]}
              onValueChange={(value) => handleZoomChange(value[0] as number)}
              min={10}
              max={200}
              step={5}
              aria-label="Zoom slider"
            />
          </div>
          <Label className="tabular-nums w-12 text-right">{zoomPercent}%</Label>
        </div>

        <TooltipProvider>
          {/* Debug panel toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showDebugPanel ? "default" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0 rounded-md"
                onClick={showDebugPanel ? closeDebugPanel : openDebugPanel}
                aria-label="Toggle Debug Panel"
              >
                <Bug className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Debug Panel</TooltipContent>
          </Tooltip>

          {/* MiniMap toggle - rightmost position */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showMiniMap ? "default" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0 rounded-md"
                onClick={toggleMiniMap}
                aria-label="Toggle Minimap"
              >
                <Map className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Minimap</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
