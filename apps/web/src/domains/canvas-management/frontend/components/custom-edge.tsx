'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
  useReactFlow,
} from '@xyflow/react';
import { EdgeToolbar } from './edge-toolbar';
import { useCanvasEdgeManagement } from '../hooks/use-canvas-edge-management';

/**
 * CustomEdge Component
 *
 * React Flow 커스텀 엣지 컴포넌트
 * - 엣지 선택 시 EdgeToolbar 표시 (상단에 배치)
 * - 엣지 중앙에 라벨 표시 (편집 가능, 더블클릭 또는 클릭 시 편집 모드)
 * - 다양한 엣지 타입 지원 (default, straight, step, smoothstep, simplebezier)
 *
 * @see 03-user-flow.md - Screen 3: 엣지 편집 모드
 * @see https://reactflow.dev/examples/edges/edge-label-renderer
 * @see https://reactflow.dev/learn/customization/edge-labels
 */
export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps) {
  const { getEdge } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [editingLabel, setEditingLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 엣지 정보 가져오기
  const edge = getEdge(id);
  // data.actualEdgeType을 사용 (React Flow는 항상 'custom' 타입 사용)
  const edgeType = (data?.actualEdgeType as string) || 'default';
  const label = edge?.label as string | undefined;
  const pageId = (data?.pageId as string) || '';
  const edgeManagement = useCanvasEdgeManagement(pageId);

  // 편집 모드 진입 시 input에 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 엣지 타입에 따라 경로 계산
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  switch (edgeType) {
    case 'straight':
      [edgePath, labelX, labelY] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
      break;
    case 'step':
    case 'smoothstep':
      [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
      break;
    case 'simplebezier':
    case 'default':
    default:
      [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
      break;
  }

  // 툴바 위치: 엣지 상단 (y 좌표가 더 작은 쪽)
  const toolbarY = Math.min(sourceY, targetY) - 10;

  // 라벨 편집 시작
  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      setEditingLabel(label || '');
      setIsEditing(true);
    }
  };

  // 라벨 편집 완료
  const handleLabelBlur = async () => {
    if (editingLabel !== label) {
      await edgeManagement.updateEdgeLabel(id, editingLabel);
    }
    setIsEditing(false);
  };

  // Enter 키로 편집 완료
  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setEditingLabel(label || '');
      setIsEditing(false);
    }
  };

  return (
    <>
      {/* 엣지 경로 */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          // 선택 시 약간 두껍게, 아니면 설정된 두께 사용
          strokeWidth: style.strokeWidth
            ? selected
              ? (style.strokeWidth as number) + 0.5
              : (style.strokeWidth as number)
            : selected
              ? 2.5
              : 1.5,
          // 선택 시 파란색, 아니면 설정된 색상 사용
          stroke: selected ? '#3b82f6' : style.stroke || '#b1b1b7',
        }}
      />

      <EdgeLabelRenderer>
        {/* 엣지 툴바 (상단, 선택된 엣지에만 표시) */}
        {selected && pageId && id && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px,${toolbarY}px)`,
              pointerEvents: 'all',
            }}
          >
            <EdgeToolbar pageId={pageId} edgeId={id} />
          </div>
        )}

        {/* 엣지 라벨 (중앙, 항상 표시, 클릭 시 편집 가능) */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editingLabel}
              onChange={e => setEditingLabel(e.target.value)}
              onBlur={handleLabelBlur}
              onKeyDown={handleLabelKeyDown}
              className="bg-white border-2 border-blue-500 rounded px-2 py-1 text-xs text-gray-700 shadow-md focus:outline-none min-w-[60px]"
              style={{ pointerEvents: 'all' }}
            />
          ) : (
            <button
              onClick={handleLabelClick}
              className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 shadow-sm hover:bg-white hover:border-gray-300 transition-colors"
              style={{ pointerEvents: 'all' }}
            >
              {label || '라벨 추가'}
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
