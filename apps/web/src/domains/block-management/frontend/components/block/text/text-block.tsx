'use client';

import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { TextBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BaseBlock } from '../base-block/base-block';
import {
  TextBlockProperties,
  TextAlign,
  FontSize,
} from '@/domains/block-management/shared/types/block-properties.types';
import { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';
import { cn } from '@workspace/ui/lib/utils';
import { useBlockPropertyUpdate } from '../../../hooks/use-block-property-update';

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
  const nodeData = data as TextBlockNodeData;
  const {
    blockType,
    size = { width: 200, height: 120 },
    properties = {},
  } = nodeData;

  // 노드 크기 설정 (React Flow props 우선, 그 다음 data.size, 마지막 기본값)
  const width = nodeW || size.width;
  // 높이는 고정하지 않음 - 콘텐츠에 따라 자동 조정
  const height = nodeH || size.height;

  const textBlockProperties = properties as TextBlockProperties;

  // 스타일 속성 추출
  const color = textBlockProperties.color || ColorToken.GRAY;
  const richStyle = textBlockProperties.richStyle || false;
  const textAlign = textBlockProperties.textAlign || TextAlign.LEFT;
  const fontSize = textBlockProperties.fontSize || FontSize.MEDIUM;

  // Tailwind 클래스 생성 (BaseBlock에서 처리하므로 제거)
  const textAlignClass =
    textAlign === TextAlign.CENTER
      ? 'text-center'
      : textAlign === TextAlign.RIGHT
        ? 'text-right'
        : 'text-left';

  // Block property update hook
  const { updateProperty } = useBlockPropertyUpdate();

  // 텍스트 편집 상태 (SSOT)
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(
    textBlockProperties.content || ''
  );
  const [textAreaHeight, setTextAreaHeight] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);
  const [isDoubleClickMode, setIsDoubleClickMode] = useState(false);

  // Debounce timer for content updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 최신 값을 읽기 위한 refs (이펙트 안에서 stale 방지)
  const draftContentRef = useRef(draftContent);
  useEffect(() => {
    draftContentRef.current = draftContent;
  }, [draftContent]);

  // 외부 데이터가 바뀌었을 때, 편집 중이 아니면 초안 동기화
  useEffect(() => {
    if (!isEditing) {
      setDraftContent(textBlockProperties.content || '');
    }
  }, [textBlockProperties.content, isEditing]);

  // Cleanup: debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Content 업데이트 함수 (Optimistic Update + Server Sync)
  const saveContentToServer = useCallback(
    async (content: string) => {
      if (content === textBlockProperties.content) {
        return; // 변경사항이 없으면 저장하지 않음
      }

      try {
        await updateProperty(id, 'properties.content', content);
      } catch (error) {
        console.error('Failed to save content:', error);
      }
    },
    [id, updateProperty, textBlockProperties.content]
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
    }
    if (!selected) {
      setIsDoubleClickMode(false);
    }
  }, [isEditing, selected]);

  // textarea 자동 리사이즈 및 실시간 높이 업데이트
  useEffect(() => {
    if (textareaRef.current && selected) {
      const textarea = textareaRef.current;

      const calculateHeight = () => {
        // 정확한 높이 측정을 위한 임시 textarea
        const tempTextarea = document.createElement('textarea');
        tempTextarea.style.position = 'absolute';
        tempTextarea.style.left = '-9999px';
        tempTextarea.style.top = '-9999px';
        tempTextarea.style.visibility = 'hidden';

        // 원본 textarea의 스타일 복사
        const computedStyle = window.getComputedStyle(textarea);
        tempTextarea.style.width = computedStyle.width;
        tempTextarea.style.fontSize = computedStyle.fontSize;
        tempTextarea.style.fontFamily = computedStyle.fontFamily;
        tempTextarea.style.fontWeight = computedStyle.fontWeight;
        tempTextarea.style.lineHeight = computedStyle.lineHeight;
        tempTextarea.style.padding = computedStyle.padding;
        tempTextarea.style.border = computedStyle.border;
        tempTextarea.style.boxSizing = computedStyle.boxSizing;
        tempTextarea.style.wordWrap = computedStyle.wordWrap;
        tempTextarea.style.whiteSpace = computedStyle.whiteSpace;
        tempTextarea.style.resize = 'none';
        tempTextarea.style.overflow = 'hidden';
        tempTextarea.rows = 1;

        tempTextarea.value = draftContent;
        document.body.appendChild(tempTextarea);
        tempTextarea.style.height = 'auto';
        const scrollHeight = tempTextarea.scrollHeight;
        document.body.removeChild(tempTextarea);

        // textarea에 높이 적용
        textarea.style.height = `${scrollHeight}px`;
        setTextAreaHeight(scrollHeight);
      };

      requestAnimationFrame(calculateHeight);
    }
  }, [draftContent, selected, id, width]);

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
  }, []);

  const handleTextareaBlur = useCallback(() => {
    setIsEditing(false);

    // Blur 시 debounce timer 취소하고 즉시 저장
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // 즉시 저장
    saveContentToServer(draftContent);
  }, [draftContent, saveContentToServer]);

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      if ((e as any)?.nativeEvent?.isComposing || isComposingRef.current)
        return;

      // ESC → 편집 모드 종료 (선택 상태 유지)
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
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

        // Debounce timer 취소하고 즉시 저장
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        saveContentToServer(draftContent);

        if (textareaRef.current) textareaRef.current.blur();
      }
    },
    [draftContent, saveContentToServer]
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

  const handleTextareaInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    },
    []
  );

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
      <div className="w-full h-full flex flex-col">
        {/* Content */}
        <div className="flex-1 p-3" onClick={handleTextBlockClick}>
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
              onInput={handleTextareaInput}
              placeholder="Enter text..."
              className={cn(
                'w-full resize-none border-none outline-none leading-tight nodrag bg-transparent',
                textAlignClass
              )}
              style={{
                fontSize: fontSize,
                fontWeight: 'normal',
                fontFamily: 'inherit',
                height: textAreaHeight || 'auto',
                minHeight: '1.2em',
                overflow: 'hidden',
                lineHeight: '1.4',
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
