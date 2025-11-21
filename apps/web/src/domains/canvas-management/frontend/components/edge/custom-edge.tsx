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
import { cn } from '@workspace/ui/lib/utils';
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
  const [draftLabel, setDraftLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 원본 label 저장 (서버에 저장된 값)
  const originalLabelRef = useRef('');

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

  // 외부 데이터가 바뀌었을 때, 편집 중이 아니면 초안 동기화
  useEffect(() => {
    if (!isEditing) {
      setDraftLabel(label || '');
      originalLabelRef.current = label || '';
    }
  }, [label, isEditing]);

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
      // 편집 시작 시 현재 값을 원본으로 저장
      originalLabelRef.current = label || '';
      setDraftLabel(label || '');
      setIsEditing(true);
    }
  };

  // 라벨 편집 완료
  const handleLabelBlur = async () => {
    setIsEditing(false);

    // 원본 값(서버에 저장된 값)과 비교
    if (draftLabel !== originalLabelRef.current) {
      await edgeManagement.updateEdgeLabel(id, draftLabel);
      // 서버 저장 성공 후 원본 값 업데이트
      originalLabelRef.current = draftLabel;
    }
  };

  // Enter 키로 편집 완료
  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      // Escape: 원본 값으로 복원
      setDraftLabel(originalLabelRef.current);
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

        {/* 엣지 라벨 (중앙, 라벨이 있거나 선택/편집 중일 때만 표시) */}
        {(label || selected || isEditing) && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              className={cn(
                'px-3 py-2 flex items-center justify-center rounded-md transition-all',
                selected || isEditing
                  ? 'bg-background/90 backdrop-blur-sm border border-border shadow-sm'
                  : label
                    ? 'bg-background/70 backdrop-blur-sm'
                    : 'bg-transparent'
              )}
              onClick={handleLabelClick}
              style={{ pointerEvents: 'all' }}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={draftLabel}
                  onChange={e => setDraftLabel(e.target.value)}
                  onBlur={handleLabelBlur}
                  onKeyDown={handleLabelKeyDown}
                  placeholder="Add Label"
                  className={cn(
                    'text-xs text-center',
                    'bg-transparent border-none outline-none',
                    'text-muted-foreground',
                    'placeholder:text-muted-foreground/60 placeholder:italic',
                    'transition-colors'
                  )}
                  autoFocus
                  style={{
                    pointerEvents: 'all',
                    width: draftLabel
                      ? `${Math.max(draftLabel.length * 7, 70)}px`
                      : '70px',
                  }}
                />
              ) : (
                <p
                  className="text-xs text-center cursor-text text-muted-foreground italic transition-colors whitespace-nowrap"
                  style={{ pointerEvents: 'all' }}
                >
                  {label || 'Add Label'}
                </p>
              )}
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
