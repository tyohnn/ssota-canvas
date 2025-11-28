'use client';

import React, {
  memo,
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import type { NodeProps } from '@xyflow/react';
import type { ShapeBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BaseBlock } from '../base-block';
import {
  ShapeBlockProperties,
  ShapeType,
} from '@/domains/block-management/shared/value-objects/block-properties';
import {
  ColorToken,
  getSelectedRingClasses,
  getGlowColor,
} from '@/domains/block-management/shared/types/style-tokens.types';
import { cn } from '@workspace/ui/lib/utils';
import { useBlockTitleUpdate } from '@/domains/block-management/frontend/hooks/use-block-title-update';
import { useCanvasMode } from '@/domains/canvas-management/frontend/hooks/use-canvas-mode';

/**
 * Shape Block Node Component
 *
 * BaseBlock을 사용하여 구현된 도형 블럭 타입
 * 공통 기능(NodeResizer, Handle, Toolbar)을 BaseBlock에서 제공받음
 */
export const ShapeBlock = memo(function ShapeBlock({
  id,
  data,
  selected,
  dragging,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  // TypeScript 타입 안전성을 위한 데이터 접근
  if (!data) {
    console.error('ShapeBlock: data is required');
    return null;
  }

  const nodeData = data as ShapeBlockNodeData;
  const {
    blockType,
    size = { width: 150, height: 150 },
    properties = {},
  } = nodeData;

  // 노드 크기 설정 (React Flow props 우선, 그 다음 data.size, 마지막 기본값)
  const width = nodeW || size.width;
  const height = nodeH || size.height;

  const shapeBlockProperties = properties as ShapeBlockProperties;

  // 스타일 속성 추출
  const shapeType = shapeBlockProperties.shapeType;
  // ✨ title을 content로 사용 (이전에는 properties.content 사용)
  // Backward compatibility: properties.content가 있으면 우선 사용하고, 없으면 nodeData.title 사용
  const content = shapeBlockProperties.content || nodeData.title || '';
  const color = shapeBlockProperties.color;
  const borderStyle = shapeBlockProperties.borderStyle;

  // Block title update hook
  const { updateTitle } = useBlockTitleUpdate();

  // Canvas mode context
  const { setTextareaEditing } = useCanvasMode();

  // 텍스트 편집 상태 (SSOT)
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);
  const [isDoubleClickMode, setIsDoubleClickMode] = useState(false);

  // 호버 상태 추적 (SVG 글로우 효과용)
  const [isHovered, setIsHovered] = useState(false);

  // Debounce timer for content updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 외부 데이터가 바뀌었을 때, 편집 중이 아니면 초안 동기화
  useEffect(() => {
    if (!isEditing) {
      setDraftContent(content);
    }
  }, [content, isEditing]);

  // Cleanup: debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Title 업데이트 함수 (Optimistic Update + Server Sync)
  const saveContentToServer = useCallback(
    async (newContent: string) => {
      if (newContent === content) {
        return; // 변경사항이 없으면 저장하지 않음
      }

      try {
        await updateTitle(id, newContent, nodeData);
      } catch (error) {
        console.error('Failed to save title:', error);
      }
    },
    [id, updateTitle, content, nodeData]
  );

  // 선택 시 편집 모드 진입 (더블클릭 모드가 활성화된 경우에만)
  useEffect(() => {
    if (selected && isDoubleClickMode && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      setIsEditing(true);
    }
  }, [selected, isDoubleClickMode]);

  // 선택이 해제되면 편집 종료 및 더블클릭 모드 리셋
  useEffect(() => {
    if (isEditing && !selected) {
      setIsEditing(false);
      setTextareaEditing(false);
    }
    if (!selected) {
      setIsDoubleClickMode(false);
    }
  }, [isEditing, selected, setTextareaEditing]);

  // 도형 클릭 핸들러 (더블클릭 모드 활성화)
  const handleShapeClick = useCallback(
    (e: React.MouseEvent) => {
      if (selected && !isDoubleClickMode) {
        e.stopPropagation();
        setIsDoubleClickMode(true);
      }
    },
    [selected, isDoubleClickMode]
  );

  // textarea 이벤트 핸들러
  const handleTextareaClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleTextareaFocus = useCallback(() => {
    setIsEditing(true);
    setTextareaEditing(true);
  }, [setTextareaEditing]);

  const handleTextareaBlur = useCallback(() => {
    setIsEditing(false);
    setTextareaEditing(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    saveContentToServer(draftContent);
  }, [draftContent, saveContentToServer, setTextareaEditing]);

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      if ((e as any)?.nativeEvent?.isComposing || isComposingRef.current)
        return;

      // ESC → 편집 모드 종료
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        setTextareaEditing(false);
        setIsDoubleClickMode(false);

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }

        if (textareaRef.current) textareaRef.current.blur();
        return;
      }

      // Cmd/Ctrl+Enter → 편집 종료 및 저장
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsEditing(false);
        setTextareaEditing(false);

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        saveContentToServer(draftContent);

        if (textareaRef.current) textareaRef.current.blur();
      }
    },
    [draftContent, saveContentToServer, setTextareaEditing]
  );

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setDraftContent(newContent);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        saveContentToServer(newContent);
      }, 500);
    },
    [saveContentToServer]
  );

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      isComposingRef.current = false;
      const newContent = e.currentTarget.value;
      setDraftContent(newContent);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        saveContentToServer(newContent);
      }, 500);
    },
    [saveContentToServer]
  );

  // 색상 매핑 (ColorToken을 실제 색상 값으로 변환)
  const colorMap: Record<
    ColorToken,
    { fill: string; stroke: string; text: string }
  > = {
    [ColorToken.GRAY]: { fill: '#f3f4f6', stroke: '#9ca3af', text: '#374151' },
    [ColorToken.RED]: { fill: '#fee2e2', stroke: '#ef4444', text: '#991b1b' },
    [ColorToken.ORANGE]: {
      fill: '#ffedd5',
      stroke: '#f97316',
      text: '#9a3412',
    },
    [ColorToken.AMBER]: { fill: '#fef3c7', stroke: '#eab308', text: '#854d0e' },
    [ColorToken.GREEN]: { fill: '#d1fae5', stroke: '#10b981', text: '#065f46' },
    [ColorToken.BLUE]: { fill: '#dbeafe', stroke: '#3b82f6', text: '#1e40af' },
    [ColorToken.PURPLE]: {
      fill: '#ede9fe',
      stroke: '#a855f7',
      text: '#6b21a8',
    },
    [ColorToken.PINK]: { fill: '#fce7f3', stroke: '#ec4899', text: '#9f1239' },
  };

  const colors = colorMap[color] || colorMap[ColorToken.BLUE];

  // Border style을 SVG stroke-dasharray로 변환
  const strokeDasharray =
    borderStyle === 'dashed' ? '8,4' : borderStyle === 'dotted' ? '2,4' : '0';

  // Shape SVG 렌더링 함수
  const renderShape = useMemo(() => {
    const commonProps = {
      fill: colors.fill,
      stroke: colors.stroke,
      strokeWidth: 2,
      strokeDasharray,
    };

    switch (shapeType) {
      case ShapeType.RECTANGLE:
        return (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={8}
            {...commonProps}
          />
        );

      case ShapeType.ELLIPSE:
        return (
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={width / 2}
            ry={height / 2}
            {...commonProps}
          />
        );

      case ShapeType.TRIANGLE:
        const trianglePoints = `${width / 2},0 ${width},${height} 0,${height}`;
        return <polygon points={trianglePoints} {...commonProps} />;

      case ShapeType.DIAMOND:
        const diamondPoints = `${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`;
        return <polygon points={diamondPoints} {...commonProps} />;

      case ShapeType.HEXAGON:
        const hexW = width / 4;
        const hexagonPoints = `${hexW},0 ${width - hexW},0 ${width},${height / 2} ${width - hexW},${height} ${hexW},${height} 0,${height / 2}`;
        return <polygon points={hexagonPoints} {...commonProps} />;

      case ShapeType.PARALLELOGRAM:
        const offset = width / 4;
        const parallelogramPoints = `${offset},0 ${width},0 ${width - offset},${height} 0,${height}`;
        return <polygon points={parallelogramPoints} {...commonProps} />;

      case ShapeType.CYLINDER:
        return (
          <g>
            {/* Bottom ellipse (바닥) */}
            <ellipse
              cx={width / 2}
              cy={(height * 7) / 8}
              rx={width / 2}
              ry={height / 8}
              {...commonProps}
            />
            {/* Middle rectangle (몸통) */}
            <rect
              x={0}
              y={height / 8}
              width={width}
              height={(height * 3) / 4}
              fill={commonProps.fill}
              stroke="none"
            />
            {/* Side lines (옆면) */}
            <line
              x1={0}
              y1={height / 8}
              x2={0}
              y2={(height * 7) / 8}
              stroke={commonProps.stroke}
              strokeWidth={commonProps.strokeWidth}
              strokeDasharray={commonProps.strokeDasharray}
            />
            <line
              x1={width}
              y1={height / 8}
              x2={width}
              y2={(height * 7) / 8}
              stroke={commonProps.stroke}
              strokeWidth={commonProps.strokeWidth}
              strokeDasharray={commonProps.strokeDasharray}
            />
            {/* Top ellipse (윗면) - 마지막에 그려서 앞에 보이도록 */}
            <ellipse
              cx={width / 2}
              cy={height / 8}
              rx={width / 2}
              ry={height / 8}
              {...commonProps}
            />
          </g>
        );

      default:
        return (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={8}
            {...commonProps}
          />
        );
    }
  }, [shapeType, width, height, colors, strokeDasharray]);

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      isConnectable={true}
      width={width}
      height={height}
      noBorder={true}
      noBackground={true}
    >
      {/* Shape Block Content */}
      <div
        className={cn(
          'w-full h-full flex flex-col rounded-lg',
          // 호버 효과 (선택되지 않았을 때만)
          !selected && 'hover:scale-[1.02] hover:rotate-1',
          // Transition
          'transition-all duration-300 ease-out'
        )}
        style={
          {
            '--glow-color': getGlowColor(color),
          } as React.CSSProperties
        }
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="relative flex items-center justify-center w-full h-full"
          onClick={handleShapeClick}
        >
          {/* SVG 도형 - 전체 크기에 꽉 채움 */}
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible transition-all duration-300"
            style={
              {
                // SVG에 그림자와 글로우 적용 (도형 모양을 따라감)
                filter: [
                  // 기본 그림자 (항상 - text block의 shadow-sm과 동일)
                  'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))',
                  // 호버/선택 시 그림자 강화 (shadow-lg와 유사)
                  ((isHovered && !selected) || selected) &&
                    'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))',
                  // 호버/선택 시 글로우
                  ((isHovered && !selected) || selected) &&
                    `drop-shadow(0 0 4px ${getGlowColor(color)})`,
                ]
                  .filter(Boolean)
                  .join(' '),
              } as React.CSSProperties
            }
            preserveAspectRatio="none"
          >
            {renderShape}
          </svg>

          {/* 텍스트 오버레이 */}
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full h-full flex items-center justify-center pointer-events-auto">
              {selected && isDoubleClickMode ? (
                <textarea
                  ref={textareaRef}
                  value={draftContent}
                  onChange={handleTextareaChange}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                  }}
                  onCompositionEnd={handleCompositionEnd}
                  onBlur={handleTextareaBlur}
                  onClick={handleTextareaClick}
                  onFocus={handleTextareaFocus}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Add text..."
                  className={cn(
                    'w-full h-full resize-none border-none outline-none nodrag bg-transparent text-center overflow-y-auto'
                  )}
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'inherit',
                    lineHeight: '1.4',
                    color: colors.text,
                  }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-center"
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    lineHeight: '1.4',
                    color: colors.text,
                    cursor: selected ? 'text' : 'default',
                  }}
                >
                  {draftContent && draftContent.trim().length > 0
                    ? draftContent
                    : selected
                      ? 'Click to add text...'
                      : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BaseBlock>
  );
});
