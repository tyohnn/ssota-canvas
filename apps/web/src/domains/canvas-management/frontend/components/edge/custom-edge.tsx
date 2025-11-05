'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
  useReactFlow,
} from '@xyflow/react';
import { useTheme } from 'next-themes';
import { EdgeToolbar } from './edge-toolbar';
import { useCanvasEdgeManagement } from '../../hooks/use-canvas-edge-management';
import { useCanvasSelection } from '../../hooks/use-canvas-selection';
import {
  getHexColor,
  getHexColorDark,
} from '@/domains/block-management/shared/types/style-tokens.types';

/**
 * CustomEdge Component
 *
 * React Flow 커스텀 엣지 컴포넌트
 * - 엣지 선택 시 EdgeToolbar 표시 (엣지 중앙 상단에 배치, z-index 최대)
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
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editingLabel, setEditingLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 엣지 정보 가져오기
  const edge = getEdge(id);

  // React Flow에서 엣지 정보 가져오기
  const { getEdges } = useReactFlow();
  const edges = getEdges();
  const currentEdge = edges.find(e => e.id === id);

  // data.actualEdgeShape을 사용 (React Flow는 항상 'custom' 타입 사용)
  const edgeShape =
    (currentEdge?.data?.actualEdgeShape as string) ||
    (data?.actualEdgeShape as string) ||
    'default';
  const label =
    (currentEdge?.label as string | undefined) ||
    (edge?.label as string | undefined);
  const pageId =
    (currentEdge?.data?.pageId as string) || (data?.pageId as string) || '';
  const orgId =
    (currentEdge?.data?.orgId as string) || (data?.orgId as string) || '';
  const workspaceId =
    (currentEdge?.data?.workspaceId as string) ||
    (data?.workspaceId as string) ||
    '';
  const edgeManagement = useCanvasEdgeManagement({
    pageId,
    orgId,
    workspaceId,
  });

  // Canvas selection 확인 (멀티 선택 체크용)
  const canvasSelection = useCanvasSelection();
  const selectedNodeCount = canvasSelection.getSelectionCount();

  // 선택된 엣지 개수 확인
  const selectedEdgeCount = edges.filter(e => e.selected).length;

  // 단일 선택: 노드 0개 + 엣지 1개, 또는 노드 1개 + 엣지 0개
  const isSingleSelection =
    (selectedNodeCount === 0 && selectedEdgeCount === 1) ||
    (selectedNodeCount === 1 && selectedEdgeCount === 0);

  // 엣지 타입 변경 시 강제 리렌더링을 위한 상태
  const [forceRender, setForceRender] = useState(0);

  // data.actualEdgeShape 변경 감지
  useEffect(() => {
    setForceRender(prev => prev + 1);
  }, [data?.actualEdgeShape]);

  // currentEdge의 actualEdgeShape 변경 감지
  useEffect(() => {
    setForceRender(prev => prev + 1);
  }, [currentEdge?.data?.actualEdgeShape]);

  // 편집 모드 진입 시 input에 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 엣지 모양에 따라 경로 계산 (useMemo로 최적화)
  const { edgePath, labelX, labelY } = useMemo(() => {
    let path: string;
    let x: number;
    let y: number;

    switch (edgeShape) {
      case 'straight':
        [path, x, y] = getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        });
        break;
      case 'step':
      case 'smoothstep':
        [path, x, y] = getSmoothStepPath({
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
        [path, x, y] = getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        });
        break;
    }

    return { edgePath: path, labelX: x, labelY: y };
  }, [
    edgeShape,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    forceRender,
  ]);

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

  // 다크모드 기본 색상
  const defaultStrokeColor = theme === 'dark' ? '#9ca3af' : '#9ca3af';
  const selectedStrokeColor = theme === 'dark' ? '#60a5fa' : '#3b82f6';

  return (
    <>
      {/* 엣지 경로 */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        key={`${id}-${edgeShape}-${forceRender}`}
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
          stroke: selected
            ? selectedStrokeColor
            : style.stroke || defaultStrokeColor,
        }}
      />

      <EdgeLabelRenderer>
        {/* 엣지 툴바 (엣지 중앙 상단, 단일 선택 시만 표시) */}
        {selected &&
          isSingleSelection &&
          pageId &&
          id &&
          orgId &&
          workspaceId && (
            <div
              className="z-50"
              style={{
                position: 'absolute',
                transform: `translate(-50%, -100%) translate(${labelX}px,${labelY - 20}px)`,
                pointerEvents: 'all',
              }}
            >
              <EdgeToolbar
                pageId={pageId}
                edgeId={id}
                orgId={orgId}
                workspaceId={workspaceId}
              />
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
              className="bg-background border-2 border-blue-500 rounded px-2 py-1 text-xs text-foreground shadow-md focus:outline-none min-w-[60px]"
              style={{ pointerEvents: 'all' }}
            />
          ) : (
            <button
              onClick={handleLabelClick}
              className="bg-background/90 backdrop-blur-sm border border-border rounded px-2 py-1 text-xs text-foreground shadow-sm hover:bg-background hover:border-border transition-colors"
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
