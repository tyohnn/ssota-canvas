"use client";

import React from "react";
import { Button } from "@workspace/ui/components/ui/button";
import { Label } from "@workspace/ui/components/ui/label";
import { Slider } from "@workspace/ui/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";
import { Map } from "lucide-react";
import { MiniMap } from "@xyflow/react";

interface CanvasViewToolbarProps {
  showMiniMap: boolean;
  toggleMiniMap: () => void;
  zoomPercent: number; // 10 - 200
  onZoomPercentChange: (percent: number) => void;
}

export function CanvasViewToolbar({
  showMiniMap,
  toggleMiniMap,
  zoomPercent,
  onZoomPercentChange,
}: CanvasViewToolbarProps) {
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
              onValueChange={(value) => onZoomPercentChange(value[0] as number)}
              min={10}
              max={200}
              step={5}
              aria-label="Zoom slider"
            />
          </div>
          <Label className="tabular-nums w-12 text-right">{zoomPercent}%</Label>
        </div>

        <TooltipProvider>
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
