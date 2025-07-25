"use client";

import React, { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Undo,
  Redo,
  Save,
  Download,
  Upload,
  Plus,
  Search,
  Settings,
  Eye,
  EyeOff,
  Grid,
  Layers,
  Palette,
  Code,
  FileText,
  Database,
  CheckSquare,
  GitBranch,
  Users,
} from "lucide-react";

interface TopToolboxProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  onNodeCreate: (nodeType: string) => void;
  onToggleGrid: () => void;
  onToggleLayers: () => void;
  onToggleTheme: () => void;
  showGrid: boolean;
  showLayers: boolean;
  canUndo: boolean;
  canRedo: boolean;
  className?: string;
}

/**
 * Top Toolbox Panel Component
 */
export function TopToolbox({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onUndo,
  onRedo,
  onSave,
  onExport,
  onImport,
  onNodeCreate,
  onToggleGrid,
  onToggleLayers,
  onToggleTheme,
  showGrid,
  showLayers,
  canUndo,
  canRedo,
  className,
}: TopToolboxProps) {
  const [showNodeCreation, setShowNodeCreation] = useState(false);

  const nodeTypes = [
    { type: "agent", icon: Users, label: "Agent", color: "blue" },
    { type: "task", icon: CheckSquare, label: "Task", color: "green" },
    { type: "workflow", icon: GitBranch, label: "Workflow", color: "orange" },
    {
      type: "artifact_template",
      icon: FileText,
      label: "Template",
      color: "purple",
    },
    { type: "checklist", icon: CheckSquare, label: "Checklist", color: "red" },
    { type: "data", icon: Database, label: "Data", color: "cyan" },
    { type: "artifact_class", icon: Layers, label: "Class", color: "lime" },
  ];

  const getNodeTypeColor = (color: string) => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      red: "bg-red-100 text-red-800 border-red-200",
      cyan: "bg-cyan-100 text-cyan-800 border-cyan-200",
      lime: "bg-lime-100 text-lime-800 border-lime-200",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className={`bg-white border-b shadow-sm ${className}`}>
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left Section - Canvas Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={onZoomOut}
              disabled={zoom <= 0.1}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="min-w-[60px] justify-center">
              {Math.round(zoom * 100)}%
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={onZoomIn}
              disabled={zoom >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onZoomReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* View Controls */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={showGrid ? "default" : "outline"}
              onClick={onToggleGrid}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={showLayers ? "default" : "outline"}
              onClick={onToggleLayers}
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onToggleTheme}>
              <Palette className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Center Section - Node Creation */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              size="sm"
              variant="default"
              onClick={() => setShowNodeCreation(!showNodeCreation)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Node
            </Button>

            {/* Node Creation Dropdown */}
            {showNodeCreation && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[200px]">
                <div className="p-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Create Node
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {nodeTypes.map((nodeType) => {
                      const Icon = nodeType.icon;
                      return (
                        <button
                          key={nodeType.type}
                          onClick={() => {
                            onNodeCreate(nodeType.type);
                            setShowNodeCreation(false);
                          }}
                          className={`flex items-center gap-2 p-2 rounded text-left hover:bg-gray-50 transition-colors ${getNodeTypeColor(nodeType.color)}`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {nodeType.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* History Controls */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* File Actions */}
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={onSave}>
              <Save className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onExport}>
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onImport}>
              <Upload className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Utility Actions */}
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline">
              <Search className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Secondary Toolbar - Quick Actions */}
      <div className="border-t bg-gray-50 px-4 py-1">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Quick Actions:</span>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
              Select All
            </Button>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
              Clear Selection
            </Button>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
              Fit to View
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4" />

          <div className="flex items-center gap-2">
            <span className="text-gray-600">View:</span>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Show Labels
            </Button>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
              <Code className="h-3 w-3 mr-1" />
              Show IDs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
