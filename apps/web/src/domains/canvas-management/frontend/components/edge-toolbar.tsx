'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import { Separator } from '@workspace/ui/components/ui/separator';
import { Trash2, Minus, Workflow, TrendingUp } from 'lucide-react';

// Canvas Management Hooks
import { useCanvasEdgeManagement } from '../hooks/use-canvas-edge-management';
import { usePreventPinchZoom } from '../hooks/use-prevent-pinch-zoom';

export interface EdgeToolbarProps {
  pageId: string;
  edgeId: string;
}

// 엣지 타입 정의 (아이콘만) - 주요 타입만 표시
const EDGE_SHAPES = [
  {
    value: 'default',
    label: '곡선',
    icon: <Workflow className="h-4 w-4" />,
  },
  { value: 'straight', label: '직선', icon: <Minus className="h-4 w-4" /> },
  {
    value: 'smoothstep',
    label: '계단형',
    icon: <TrendingUp className="h-4 w-4" />,
  },
] as const;

// 엣지 색상 정의
const EDGE_COLORS = [
  { value: '#b1b1b7', label: '회색 (기본)' },
  { value: '#000000', label: '검정' },
  { value: '#3b82f6', label: '파랑' },
  { value: '#ef4444', label: '빨강' },
  { value: '#10b981', label: '초록' },
  { value: '#f59e0b', label: '주황' },
  { value: '#8b5cf6', label: '보라' },
  { value: '#ec4899', label: '핑크' },
] as const;

// 엣지 두께 정의
const EDGE_WIDTHS = [
  {
    value: 1,
    label: '얇게',
    icon: <Minus className="h-3 w-3" strokeWidth={1} />,
  },
  {
    value: 2,
    label: '보통',
    icon: <Minus className="h-3 w-3" strokeWidth={2} />,
  },
  {
    value: 3,
    label: '두껍게',
    icon: <Minus className="h-3 w-3" strokeWidth={3} />,
  },
] as const;

/**
 * EdgeToolbar Component
 *
 * 선택된 엣지에 대한 편집 도구를 제공하는 툴바 컴포넌트
 *
 * Features:
 * - 엣지 타입 변경 Popover (아이콘만 표시)
 * - 엣지 색상 변경 Popover
 * - 엣지 두께 변경 Popover (3가지 두께)
 * - 삭제 버튼
 *
 * @see 03-user-flow.md - Screen 3: 엣지 편집 모드
 */
export function EdgeToolbar({ pageId, edgeId }: EdgeToolbarProps) {
  const edgeManagement = useCanvasEdgeManagement(pageId);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 트랙패드 핀치 줌 방지
  usePreventPinchZoom(toolbarRef);

  // Popover 상태 관리 (타입 변경 후 자동으로 닫히도록)
  const [isTypePopoverOpen, setIsTypePopoverOpen] = useState(false);
  const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
  const [isWidthPopoverOpen, setIsWidthPopoverOpen] = useState(false);

  // 현재 엣지 정보 가져오기
  const edge = edgeManagement.getEdgeById(edgeId);
  // data.actualEdgeShape 사용 (React Flow type은 항상 'custom')
  const currentShape = (edge?.data as any)?.actualEdgeShape || 'default';
  const currentColor = (edge?.style as any)?.stroke || '#b1b1b7';
  const currentWidth = (edge?.style as any)?.strokeWidth || 1.5;

  // 엣지 모양 변경 핸들러
  const handleEdgeShapeChange = async (newShape: string) => {
    const success = await edgeManagement.updateEdgeShape(edgeId, newShape);

    if (success) {
      setIsTypePopoverOpen(false); // 성공 시 Popover 닫기
    } else {
      console.error('❌ [EdgeToolbar] Failed to update edge shape');
    }
  };

  // 엣지 색상 변경 핸들러
  const handleColorChange = async (newColor: string) => {
    const success = await edgeManagement.updateEdgeStyle(edgeId, {
      stroke: newColor,
    });

    if (success) {
      setIsColorPopoverOpen(false);
    } else {
      console.error('❌ [EdgeToolbar] Failed to update edge color');
    }
  };

  // 엣지 두께 변경 핸들러
  const handleWidthChange = async (newWidth: number) => {
    const success = await edgeManagement.updateEdgeStyle(edgeId, {
      strokeWidth: newWidth,
    });

    if (success) {
      setIsWidthPopoverOpen(false);
    } else {
      console.error('❌ [EdgeToolbar] Failed to update edge width');
    }
  };

  // 엣지 삭제 핸들러
  const handleDelete = async () => {
    const success = await edgeManagement.deleteEdge(edgeId);

    if (success) {
    } else {
      console.error('❌ [EdgeToolbar] Failed to delete edge');
    }
  };

  return (
    <div
      ref={toolbarRef}
      className="nodrag nowheel bg-white/90 backdrop-blur-md border border-gray-200 rounded-lg shadow-lg px-2 py-1 flex items-center gap-1"
      style={{ touchAction: 'none' }}
      onWheel={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <TooltipProvider>
        {/* 엣지 타입 변경 Popover (아이콘만) */}
        <Popover open={isTypePopoverOpen} onOpenChange={setIsTypePopoverOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-black/5 transition-colors"
                  onMouseDown={e => e.stopPropagation()}
                  title="엣지 타입"
                >
                  {EDGE_SHAPES.find(t => t.value === currentShape)?.icon || (
                    <Workflow className="h-4 w-4" />
                  )}
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>엣지 타입</p>
            </TooltipContent>
          </Tooltip>

          <PopoverContent
            className="p-2 w-fit"
            side="top"
            align="center"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex gap-1">
              {EDGE_SHAPES.map(shape => (
                <button
                  key={shape.value}
                  onClick={e => {
                    e.stopPropagation();
                    handleEdgeShapeChange(shape.value);
                  }}
                  onMouseDown={e => e.stopPropagation()}
                  className={`p-2 rounded transition-colors ${
                    currentShape === shape.value
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100'
                  }`}
                  title={shape.label}
                >
                  {shape.icon}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-4" />

        {/* 엣지 색상 변경 Popover */}
        <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-black/5 transition-colors"
                  onMouseDown={e => e.stopPropagation()}
                  title="엣지 색상"
                >
                  <div
                    className="h-5 w-5 rounded ring-1 ring-black/10"
                    style={{ backgroundColor: currentColor }}
                  />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>엣지 색상</p>
            </TooltipContent>
          </Tooltip>

          <PopoverContent
            className="p-2 w-fit"
            side="top"
            align="center"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex gap-1.5">
              {EDGE_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={e => {
                    e.stopPropagation();
                    handleColorChange(color.value);
                  }}
                  onMouseDown={e => e.stopPropagation()}
                  style={{ backgroundColor: color.value }}
                  className={`h-6 w-6 rounded ring-1 ring-black/10 transition hover:scale-110 ${
                    currentColor === color.value ? 'ring-2 ring-blue-500' : ''
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-4" />

        {/* 엣지 두께 변경 Popover */}
        <Popover open={isWidthPopoverOpen} onOpenChange={setIsWidthPopoverOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-black/5 transition-colors"
                  onMouseDown={e => e.stopPropagation()}
                  title="엣지 두께"
                >
                  {EDGE_WIDTHS.find(w => Math.abs(w.value - currentWidth) < 0.5)
                    ?.icon || EDGE_WIDTHS[0].icon}
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>엣지 두께</p>
            </TooltipContent>
          </Tooltip>

          <PopoverContent
            className="p-2 w-fit"
            side="top"
            align="center"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex gap-1">
              {EDGE_WIDTHS.map(width => (
                <button
                  key={width.value}
                  onClick={e => {
                    e.stopPropagation();
                    handleWidthChange(width.value);
                  }}
                  onMouseDown={e => e.stopPropagation()}
                  className={`p-2 rounded transition-colors ${
                    Math.abs(width.value - currentWidth) < 0.5
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100'
                  }`}
                  title={width.label}
                >
                  {width.icon}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-4" />

        {/* 삭제 버튼 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              onMouseDown={e => e.stopPropagation()}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>삭제 (⌫)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
