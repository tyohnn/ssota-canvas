'use client';

import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { TextBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BaseBlock } from '../base-block';
import {
  TextBlockProperties,
  TextAlign,
  FontSize,
} from '@/domains/block-management/shared/value-objects/block-properties';
import {
  ColorToken,
  getSelectedRingClasses,
  getGlowColor,
  getRichStyleClasses,
} from '@/domains/block-management/shared/types/style-tokens.types';
import { cn } from '@workspace/ui/lib/utils';
import { useBlockTitleUpdate } from '@/domains/block-management/frontend/hooks/use-block-title-update';
import { useCanvasMode } from '@/domains/canvas-management/frontend/hooks/use-canvas-mode';

/**
 * Text Block Node Component
 *
 * BaseBlock을 사용하여 구현된 텍스트 블럭 타입
 * 공통 기능(NodeResizer, Handle, Toolbar)을 BaseBlock에서 제공받음
 */
export const TextBlock = memo(function TextBlock({
  id,
  data,
  selected,
  dragging,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  // TypeScript 타입 안전성을 위한 데이터 접근
  if (!data) {
    console.error('TextBlock: data is required');
    return null;
  }

  const nodeData = data as TextBlockNodeData;
  const { blockType, size, properties = {} } = nodeData;

  // 노드 크기 설정 (React Flow props 우선, 그 다음 data.size, 마지막 기본값)
  const width = nodeW || size.width;
  // 높이는 고정하지 않음 - 콘텐츠에 따라 자동 조정
  const height = nodeH || size.height;

  const textBlockProperties = properties as TextBlockProperties;

  // 스타일 속성 추출 (모든 속성은 필수값)
  const color = textBlockProperties.color;
  const richStyle = textBlockProperties.richStyle;
  const textAlign = textBlockProperties.textAlign;
  const fontSize = textBlockProperties.fontSize;

  // Tailwind 클래스 생성 (BaseBlock에서 처리하므로 제거)
  const textAlignClass =
    textAlign === TextAlign.CENTER
      ? 'text-center'
      : textAlign === TextAlign.RIGHT
        ? 'text-right'
        : 'text-left';

  // Block title update hook
  const { updateTitle } = useBlockTitleUpdate();

  // Canvas mode context
  const { setTextareaEditing } = useCanvasMode();

  // ✨ title을 content로 사용 (이전에는 properties.content 사용)
  // Backward compatibility: properties.content가 있으면 우선 사용하고, 없으면 nodeData.title 사용
  const content = nodeData.title || '';

  // 텍스트 편집 상태 (SSOT)
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);
  const [isDoubleClickMode, setIsDoubleClickMode] = useState(false);

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
      // 포커스될 때 편집 시작
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

  // 텍스트 블럭 클릭 핸들러 (더블클릭 모드 활성화)
  const handleTextBlockClick = useCallback(
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
    setTextareaEditing(true); // Context에 상태 전파
  }, [setTextareaEditing]);

  const handleTextareaBlur = useCallback(() => {
    setIsEditing(false);
    setTextareaEditing(false); // Context에 상태 전파

    // Blur 시 debounce timer 취소하고 즉시 저장
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // 즉시 저장
    saveContentToServer(draftContent);
  }, [draftContent, saveContentToServer, setTextareaEditing]);

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      if ((e as any)?.nativeEvent?.isComposing || isComposingRef.current)
        return;

      // ESC → 편집 모드 종료 (선택 상태 유지)
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        setTextareaEditing(false);
        setIsDoubleClickMode(false);

        // Debounce timer 취소 (저장하지 않음)
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

        // Debounce timer 취소하고 즉시 저장
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

      // Debounce: 500ms 후에 서버에 저장
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

      // Composition 완료 시에도 debounce 트리거
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        saveContentToServer(newContent);
      }, 500);
    },
    [saveContentToServer]
  );

  // Textarea 스크롤을 위해 네이티브 휠 이벤트 전파 막기
  // textarea가 실제로 렌더링된 후(isDoubleClickMode && selected)에만 리스너 등록
  useEffect(() => {
    // textarea가 렌더링되지 않은 상태면 리스너 등록하지 않음
    if (!selected || !isDoubleClickMode) {
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const handleWheel = (e: WheelEvent) => {
      // React Flow로 이벤트 전파 차단
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();

      // 수동으로 스크롤 처리
      const newScrollTop = textarea.scrollTop + e.deltaY;
      textarea.scrollTop = newScrollTop;
    };

    // 캡처 단계에서 먼저 이벤트 리스너 등록하여 다른 리스너보다 우선 실행
    textarea.addEventListener('wheel', handleWheel, {
      passive: false,
      capture: true, // 캡처 단계에서 처리
    });

    return () => {
      textarea.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [selected, isDoubleClickMode]); // textarea가 렌더링될 때마다 재등록

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      isConnectable={true}
      width={width}
      height={height}
      styleProps={{
        color,
        richStyle,
        textAlign,
        fontSize,
      }}
    >
      {/* Text Block Content */}
      <div
        className={cn(
          'w-full h-full flex flex-col rounded-lg',
          // Rich Style 배경색 적용 (richStyle이 true일 때)
          richStyle && getRichStyleClasses(color),
          richStyle && 'shadow-sm',
          // 호버 효과 (선택되지 않았을 때만)
          !selected && 'hover:shadow-lg hover:scale-[1.02] hover:rotate-1',
          !selected && 'hover:shadow-[0_0_4px_1px_var(--glow-color)]',
          // 선택 효과 (강화)
          selected && getSelectedRingClasses(color),
          selected && 'shadow-lg',
          selected && 'shadow-[0_0_4px_1px_var(--glow-color)]',
          // Transition
          'transition-all duration-300 ease-out'
        )}
        style={
          {
            '--glow-color': getGlowColor(color),
          } as React.CSSProperties
        }
      >
        {/* Content */}
        <div
          className="flex-1 p-3 flex flex-col"
          onClick={handleTextBlockClick}
        >
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
              placeholder="Enter text..."
              className={cn(
                'flex-1 w-full resize-none border-none outline-none nodrag bg-transparent overflow-y-auto',
                textAlignClass
              )}
              style={{
                fontSize: fontSize,
                fontWeight: 'normal',
                fontFamily: 'inherit',
                lineHeight: '1.4',
                minHeight: '1.2em',
              }}
            />
          ) : (
            <div
              className={cn('w-full', textAlignClass)}
              style={{
                fontSize: fontSize,
                fontWeight: 'normal',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                lineHeight: '1.4',
                minHeight: '1.2em',
                cursor: selected ? 'text' : 'default',
              }}
            >
              {draftContent && draftContent.trim().length > 0
                ? draftContent
                : 'Click to add text...'}
            </div>
          )}
        </div>
      </div>
    </BaseBlock>
  );
});
