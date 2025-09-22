"use client";

import { useCallback, useState, useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useReactFlowCommandsContext } from "@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext";

import { Node } from '@xyflow/react';

interface TextContentProps {
  node: Node;
  title: string;
  selected: boolean;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  textAlign?: "left" | "center" | "right";
  fontSize?: string;
  fontWeight?: string;
  textColor: string;
  width: number;
  placeholder?: string;
}

export function TextContent({
  node,
  title,
  selected,
  isEditing,
  onEditingChange,
  textAlign = "center",
  fontSize = "32px",
  fontWeight = "bold",
  textColor,
  width,
  placeholder = "Enter text..."
}: TextContentProps) {
  const reactFlow = useReactFlow();
  const { nodeCommands, styleCommands } = useReactFlowCommandsContext();
  const [textAreaHeight, setTextAreaHeight] = useState(0);
  
  // 텍스트 초안
  const [draftTitle, setDraftTitle] = useState<string>(title || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);

  // 최신 값을 읽기 위한 refs (이펙트 안에서 stale 방지)
  const draftTitleRef = useRef(draftTitle);
  useEffect(() => { 
    draftTitleRef.current = draftTitle; 
  }, [draftTitle]);

  // 저장 루프/중복 저장 방지
  const lastHeightUpdateRef = useRef<number>(0);
  const savedAfterEditRef = useRef<boolean>(true); // 편집 세션당 한 번만 커밋

  // 빈 문자열일 때 라벨 대체용(선택) - 최근 비빈 문자열을 보관
  const lastNonEmptyTitleRef = useRef<string>(title || '');
  useEffect(() => {
    const t = title || '';
    if (t.trim()) lastNonEmptyTitleRef.current = t;
  }, [title]);

  // lastHeightUpdateRef 초기화
  // useEffect(() => {
  //   if (lastHeightUpdateRef.current === 0) {
  //     lastHeightUpdateRef.current = height;
  //   }
  // }, [height]);

  // 외부 데이터가 바뀌었을 때, 편집 중이 아니면 초안 동기화
  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(title || '');
    }
  }, [title, isEditing]);

  // 선택 시 textarea 자동 포커스
  useEffect(() => {
    if (selected && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      // 포커스될 때 편집 시작
      onEditingChange(true);
    }
  }, [selected, onEditingChange]);

  // 선택이 해제되면 편집 종료 (SSOT 전이 → 커밋 트리거)
  useEffect(() => {
    if (isEditing && !selected) {
      onEditingChange(false);
    }
  }, [isEditing, selected, onEditingChange]);

  // textarea 자동 리사이즈 및 실시간 높이 업데이트
  useEffect(() => {
    if (textareaRef.current && selected) {
      const textarea = textareaRef.current;
      // 정확한 높이 계산을 위한 로직
      const calculateHeight = () => {
        // 임시 textarea로 정확한 높이 측정
        const measureHeight = () => {
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
          
          // rows 속성도 복사 (중요!)
          tempTextarea.rows = 1;
          
          tempTextarea.value = draftTitle;
          document.body.appendChild(tempTextarea);
          tempTextarea.style.height = 'auto';
          const scrollHeight = tempTextarea.scrollHeight;
          document.body.removeChild(tempTextarea);
          
          return scrollHeight;
        };
        
        // 정확한 높이 측정
        const scrollHeight = measureHeight();
        
        // textarea에 높이 적용
        textarea.style.height = `${scrollHeight}px`;
        // 텍스트가 변경되었을 때만 높이 업데이트 (선택만으로는 업데이트하지 않음)
        setTextAreaHeight(scrollHeight);
      };

      requestAnimationFrame(calculateHeight);
    }
  }, [draftTitle, selected, node.id, width, reactFlow]);

  // isEditing 전이 기반 단일 커밋 경로
  useEffect(() => {
    if (isEditing) {
      // 편집이 시작되었음: 아직 저장 안함
      savedAfterEditRef.current = false;
      return;
    }

    // 여기까지 왔다는 것은 isEditing === false
    // 이전에 저장하지 않았다면 이번 전이에서 한 번만 저장
    if (!savedAfterEditRef.current) {
      savedAfterEditRef.current = true;

      const nextTitle = draftTitleRef.current;

      // 1) 텍스트 저장 (빈 문자열은 저장하지 않음: DB 검증 에러 회피)
      (async () => {
        try {
          if (nextTitle.trim().length > 0 && nextTitle !== title) {
            const res = await nodeCommands.updateNodeData(node, { title: nextTitle });
            if (!res.ok) {
              console.error("제목 업데이트 실패:", res.error);
            }
          }
        } catch (e) {
          console.error("제목 업데이트 중 예외:", e);
        }
      })();
    }
  // 의존성: isEditing 전이 감지 + 비교에 필요한 최소 항목
  }, [isEditing, node.id, nodeCommands, styleCommands, title]);

  // textarea 이벤트
  const handleTextareaClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleTextareaFocus = useCallback(() => {
    onEditingChange(true);
  }, [onEditingChange]);

  const handleTextareaBlur = useCallback(() => {
    // blur 자체로 저장하지 않는다. SSOT는 isEditing.
    onEditingChange(false);
  }, [onEditingChange]);

  const handleTextareaKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if ((e as any)?.nativeEvent?.isComposing || isComposingRef.current) return;

    // Cmd/Ctrl+Enter → 편집 종료(=커밋 트리거)
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onEditingChange(false);
      // UX 측면에서 포커스도 제거
      if (textareaRef.current) textareaRef.current.blur();
    }
  }, [onEditingChange]);

  const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  const getTextAlignClass = () => {
    switch (textAlign) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      default: return 'text-center';
    }
  };

  const getJustifyClass = () => {
    switch (textAlign) {
      case 'left': return 'justify-start';
      case 'right': return 'justify-end';
      default: return 'justify-center';
    }
  };

  return (
    <div className={`w-full ${getJustifyClass()}`}>
      {selected ? (
        <textarea
          ref={textareaRef}
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onCompositionStart={() => { isComposingRef.current = true; }}
          onCompositionEnd={(e) => {
            isComposingRef.current = false;
            setDraftTitle(e.currentTarget.value);
          }}
          onBlur={handleTextareaBlur}
          onClick={handleTextareaClick}
          onFocus={handleTextareaFocus}
          onKeyDown={handleTextareaKeyDown}
          placeholder={placeholder}
          // rows={1}
          className={`w-full resize-none border-none outline-none bg-transparent leading-tight nodrag ${getTextAlignClass()}`}
          style={{
            fontSize,
            fontWeight,
            color: textColor,
            fontFamily: 'inherit',
            height: textAreaHeight,
            minHeight: '1.2em',
            overflow: 'hidden',
            lineHeight: '1.2',
          }}
        />
      ) : (
        <div
          className={`w-full ${getTextAlignClass()}`}
          style={{
            fontSize,
            fontWeight,
            color: textColor,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.2',
          }}
        >
          {(title && title.trim().length > 0)
            ? title
            : (lastNonEmptyTitleRef.current || 'Text Node')}
        </div>
      )}
    </div>
  );
}
