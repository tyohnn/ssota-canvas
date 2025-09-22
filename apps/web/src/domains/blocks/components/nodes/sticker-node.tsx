"use client";

import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizeControl, useReactFlow, ResizeControlVariant } from '@xyflow/react';
import { 
  useReactFlowNodeSelection,
} from "@/domains/react-flow-canvas/contexts/ReactFlowSelectionContext";
import { useReactFlowCommandsContext } from "@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import {
  ShapePolicy,
  type ColorKey,
} from "@/domains/blocks/policy/shape-policy";
import { NodeTopToolbar } from "./node-top-toolbar";
import { useNodeKeyboardShortcuts } from "../../hooks/use-node-keyboard-shortcuts";
import type { ReactFlowTextNodeData } from "@/domains/blocks/types/text.node";

type TextNodeProps = {
  id: string;
  data: ReactFlowTextNodeData;
  selected?: boolean;
  width: number;
  height: number;
};

const TextNode = ({ id, data, selected, width, height }: TextNodeProps) => {
  console.log("TextNode", id, data, selected, width, height);
  const reactFlow = useReactFlow();
  const { isSingleSelected } = useReactFlowNodeSelection();
  const { nodeCommands, styleCommands } = useReactFlowCommandsContext();
  
  // 편집 상태 (SSOT)
  const [isEditing, setIsEditing] = useState(false);

  // 텍스트 초안
  const [draftTitle, setDraftTitle] = useState<string>(data.title || '');
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
  const lastNonEmptyTitleRef = useRef<string>(data.title || '');
  useEffect(() => {
    const t = data.title || '';
    if (t.trim()) lastNonEmptyTitleRef.current = t;
  }, [data.title]);

  // 색상 처리
  const rawColor = data.nodeUI?.color ?? ShapePolicy.getDefaultColor();
  const availableColors = ShapePolicy.getColorOptions().map((c) => c.value);
  const color = rawColor.startsWith("#")
    ? ShapePolicy.getClosestColorKey(rawColor)
    : availableColors.includes(rawColor)
      ? (rawColor as ColorKey)
      : ShapePolicy.getDefaultColor();
  const borderColor = ShapePolicy.getBorderColor(color);
  const tailwindBorderColor = ShapePolicy.getTailwindBorderColor(color);
  const tailwindBgColor = ShapePolicy.getTailwindBgColor(color);
  const textColor = ShapePolicy.getTextColor(color);
  const backgroundColor = ShapePolicy.getShapeBackgroundColor(color);

  // 키보드 숏컷
  useNodeKeyboardShortcuts(id, selected || false);

  // 외부 데이터가 바뀌었을 때, 편집 중이 아니면 초안 동기화
  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(data.title || '');
    }
  }, [data.title, isEditing]);


  // 선택 시 textarea 자동 포커스
  useEffect(() => {
    if (selected && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      // 포커스될 때 편집 시작
      setIsEditing(true);
    }
  }, [selected]);

  // 선택이 해제되면 편집 종료 (SSOT 전이 → 커밋 트리거)
  useEffect(() => {
    if (isEditing && !selected) {
      setIsEditing(false);
    }
  }, [isEditing, selected]);

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

        // 필요 높이 계산 (패딩+보더 포함)
        const padding = 20;
        const border = 4;
        const requiredHeight = scrollHeight + padding + border;

        // React Flow 노드 높이 즉시 업데이트 (DB 저장 없이)
        if (requiredHeight !== height) {
          reactFlow.updateNode(id, { 
            height: requiredHeight
          });
        }
      };

      requestAnimationFrame(calculateHeight);
    }
  }, [draftTitle, selected, id, styleCommands, width, height]);

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
          if (nextTitle.trim().length > 0 && nextTitle !== data.title) {
            const res = await nodeCommands.updateNodeData(id, { title: nextTitle });
            if (!res.ok) {
              console.error("제목 업데이트 실패:", res.error);
            }
          }
        } catch (e) {
          console.error("제목 업데이트 중 예외:", e);
        }

        // 2) 높이 저장 (현재 React Flow 노드의 높이를 DB에 저장)
        try {
          const currentNode = reactFlow.getNode(id);
          const currentHeightRaw = currentNode?.style?.height || height;
          const currentHeight = typeof currentHeightRaw === 'string' ? parseInt(currentHeightRaw, 10) : currentHeightRaw;
          
          if (currentHeight !== height && currentHeight !== lastHeightUpdateRef.current) {
            lastHeightUpdateRef.current = currentHeight;
            const res = await styleCommands.updateSize(id, { width, height: currentHeight });
            if (!res.ok) {
              console.error("높이 자동 업데이트 실패:", res.error);
              lastHeightUpdateRef.current = height;
            }
          }
        } catch (e) {
          console.error("높이 업데이트 중 예외:", e);
          lastHeightUpdateRef.current = height;
        }
      })();
    }
  // 의존성: isEditing 전이 감지 + 비교에 필요한 최소 항목
  }, [isEditing, id, nodeCommands, styleCommands, data.title, height, width, reactFlow]);

  // 리사이즈 핸들(좌/우) - 너비만 반영
  const handleResizeEnd = useCallback(async (_event: any, resizeData: { width: number; height: number }) => {
    const result = await styleCommands.updateSize(id, {
      width: resizeData.width,
      height: resizeData.height, // React Flow에서 관리하는 높이 사용
    });
    if (!result.ok) {
      console.error("노드 사이즈 업데이트 실패:", result.error);
    }
  }, [id, styleCommands]);

  // 색상 변경
  const setColor = useCallback(async (newColor: ColorKey) => {
    const result = await styleCommands.updateColor(id, newColor);
    if (!result.ok) {
      console.error("색상 업데이트 실패:", result.error);
    }
  }, [id, styleCommands]);

  // textarea 이벤트
  const handleTextareaClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleTextareaFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleTextareaBlur = useCallback(() => {
    // blur 자체로 저장하지 않는다. SSOT는 isEditing.
    setIsEditing(false);
  }, []);

  const handleTextareaKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if ((e as any)?.nativeEvent?.isComposing || isComposingRef.current) return;

    // Cmd/Ctrl+Enter → 편집 종료(=커밋 트리거)
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsEditing(false);
      // UX 측면에서 포커스도 제거
      if (textareaRef.current) textareaRef.current.blur();
    }
  }, []);

  // 툴바(색상)
  const toolbarItems = (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              className="h-5 w-5 rounded ring-1 ring-black/10"
              style={{ backgroundColor: ShapePolicy.getHexColor(color) }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="p-2 w-fit"
          side="top"
          align="center"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1.5">
            {ShapePolicy.getColorOptions().map((colorOption) => (
              <button
                key={colorOption.value || colorOption.label}
                onClick={(e) => {
                  e.stopPropagation();
                  setColor(colorOption.value as ColorKey);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ backgroundColor: ShapePolicy.getHexColor(colorOption.value as ColorKey) }}
                className={`h-6 w-6 rounded ring-1 ring-black/10 transition hover:scale-110 ${
                  color === colorOption.value ? "ring-2 ring-blue-500" : ""
                }`}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );

  return (
    <>
      {/* 좌/우 가로 리사이즈 라인 */}
      {selected && (
        <>
          <NodeResizeControl
            nodeId={id}
            position="left"
            variant={ResizeControlVariant.Line}
            resizeDirection="horizontal"
            minWidth={100}
            onResizeEnd={handleResizeEnd}
            style={{ background: 'transparent', border: 'none' }}
          />
          <NodeResizeControl
            nodeId={id}
            position="right"
            variant={ResizeControlVariant.Line}
            resizeDirection="horizontal"
            minWidth={100}
            onResizeEnd={handleResizeEnd}
            style={{ background: 'transparent', border: 'none' }}
          />
        </>
      )}

      {/* 상단 툴바 */}
      <NodeTopToolbar
        nodeId={id}
        selected={selected || false}
        isSingleSelected={isSingleSelected}
        toolbarItems={toolbarItems}
        isInstance={data.role === "instance"}
      />

      {/* 핸들 */}
      <Handle type="target" position={Position.Left} className="opacity-50 w-2.5 h-2.5" />

      {/* 노드 본문 */}
      <div
        className={`w-full p-2.5 rounded-md border-4 transition-colors relative flex justify-center overflow-hidden ${selected ? 'border-primary' : tailwindBorderColor}`}
        style={{ 
          backgroundColor, 
          width,
          height,
        }}
      >
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
            placeholder="Enter text..."
            className="w-full resize-none border-none outline-none bg-transparent leading-tight nodrag text-center"
            style={{
              fontSize: data.nodeUI?.fontSize || '32px',
              fontWeight: data.nodeUI?.weight || 'bold',
              color: textColor,
              fontFamily: 'inherit',
              height: 'auto',
              minHeight: '1.2em',
              overflow: 'hidden',
              lineHeight: '1.2',
            }}
          />
        ) : (
          <div
            className="w-full text-center"
            style={{
              fontSize: data.nodeUI?.fontSize || '32px',
              fontWeight: data.nodeUI?.weight || 'bold',
              color: textColor,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: '1.2',
            }}
          >
            {(data.title && data.title.trim().length > 0)
              ? data.title
              : (lastNonEmptyTitleRef.current || 'Text Node')}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="opacity-50 w-2.5 h-2.5" />
    </>
  );
};

export default memo(TextNode);
