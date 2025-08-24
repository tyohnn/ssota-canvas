"use client";

import React from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Undo,
  Redo,
  Save,
  Download,
  Upload,
  Grid3x3,
  Layers,
} from "lucide-react";

import { Button } from "@workspace/ui/components/ui/button";
import { Separator } from "@workspace/ui/components/ui/separator";
import { Badge } from "@workspace/ui/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";
import { useCanvas } from "@/domains/workflow-canvas/contexts/CanvasContext";
import {
  PAGE_BLOCK_ICONS,
  PAGE_BLOCK_COLOR_TOKENS,
  getBlockColorClasses,
} from "@/domains/workflow-canvas/policy";

interface TopToolboxProps {
  className?: string;
}

export function TopToolbox({ className }: TopToolboxProps) {
  const {
    zoom,
    showGrid,
    showLayers,
    canUndo,
    canRedo,
    selectedPageBlock,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleUndo,
    handleRedo,
    handleSave,
    handleExport,
    handleImport,
    handleToggleGrid,
    handleToggleLayers,
  } = useCanvas();

  // Page Type Badge Component
  const PageTypeBadgeComponent = () => {
    if (!selectedPageBlock) return null;

    const Icon =
      PAGE_BLOCK_ICONS[
        selectedPageBlock.block_type as keyof typeof PAGE_BLOCK_ICONS
      ];
    const colorToken =
      PAGE_BLOCK_COLOR_TOKENS[
        selectedPageBlock.block_type as keyof typeof PAGE_BLOCK_COLOR_TOKENS
      ];

    if (!Icon || !colorToken) return null;

    return (
      <Badge
        variant="outline"
        className={`text-xs px-2 py-0.5 border ${getBlockColorClasses(colorToken).border200} ${getBlockColorClasses(colorToken).bg50} ${getBlockColorClasses(colorToken).text700}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {selectedPageBlock.block_type.charAt(0).toUpperCase() +
          selectedPageBlock.block_type.slice(1)}
      </Badge>
    );
  };

  // Page Title Component
  const PageTitleComponent = () => (
    <div className="flex items-center gap-2">
      <PageTypeBadgeComponent />
      {selectedPageBlock?.name && (
        <div className="text-sm font-medium text-foreground">
          {selectedPageBlock.name}
        </div>
      )}
    </div>
  );

  // History Controls Component
  const HistoryControlsComponent = () => (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            <Undo className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Undo</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Redo</p>
        </TooltipContent>
      </Tooltip>
    </>
  );

  // Zoom Controls Component
  const ZoomControlsComponent = () => (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Zoom Out</p>
        </TooltipContent>
      </Tooltip>

      <Button variant="ghost" size="sm" onClick={handleZoomReset}>
        {Math.round(zoom)}%
      </Button>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Zoom In</p>
        </TooltipContent>
      </Tooltip>
    </>
  );

  // View Controls Component
  const ViewControlsComponent = () => (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={showGrid ? "default" : "ghost"}
            size="sm"
            onClick={handleToggleGrid}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{showGrid ? "Hide" : "Show"} Grid</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={showLayers ? "default" : "ghost"}
            size="sm"
            onClick={handleToggleLayers}
          >
            <Layers className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{showLayers ? "Hide" : "Show"} Layers</p>
        </TooltipContent>
      </Tooltip>
    </>
  );

  // File Operations Component
  const FileOperationsComponent = () => (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Save</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Export</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Import</p>
        </TooltipContent>
      </Tooltip>
    </>
  );

  // Right Controls Component
  const RightControlsComponent = () => (
    <div className="flex items-center gap-2">
      <HistoryControlsComponent />
      <Separator orientation="vertical" className="h-6 border-border" />
      <ZoomControlsComponent />
      <Separator orientation="vertical" className="h-6 border-border" />
      <ViewControlsComponent />
      <Separator orientation="vertical" className="h-6 border-border" />
      <FileOperationsComponent />
    </div>
  );

  return (
    <div
      className={`flex items-center justify-between bg-background border-b border-border px-4 py-2 ${className}`}
    >
      {/* Left side - Page Title with Badge */}
      <PageTitleComponent />

      {/* Right side - Controls */}
      <RightControlsComponent />
    </div>
  );
}
