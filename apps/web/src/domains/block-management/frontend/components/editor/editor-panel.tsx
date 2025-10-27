'use client';

import { useState, useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { ChevronsRight, Expand, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCanvasMode } from '@/domains/canvas-management/frontend/hooks/use-canvas-mode';
import { updateBlockTitleAction } from '../../../actions/block.actions';
import { BlockPropertiesSection } from './block-properties-section';

export interface EditorPanelProps {
  blockId: string;
  isOpen: boolean;
}

/**
 * Block Management 전용 Editor Panel
 *
 * - Notion 스타일 우측 슬라이드 패널
 * - 블록 정보 표시 및 편집
 * - Style Section, Property Section
 */
export function EditorPanel({ blockId, isOpen }: EditorPanelProps) {
  const { getNode, updateNode, fitView, setCenter, getZoom, getViewport } =
    useReactFlow();
  const canvasMode = useCanvasMode();

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // React Flow Store에서 블록 데이터 읽기
  const blockNode = getNode(blockId);
  const blockData = blockNode?.data;

  // Title 상태 동기화
  useEffect(() => {
    if (blockData) {
      setTitle((blockData.title as string) || '새 블럭');
    }
  }, [blockData]);

  // 슬라이드 애니메이션 처리 및 블록 포커스
  useEffect(() => {
    if (isOpen) {
      // Show: Start rendering and trigger slide-in animation
      setShouldRender(true);
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);

      // 블록을 에디터 패널 좌측에 배치 (패널 애니메이션과 동시에)
      const node = getNode(blockId);
      if (node) {
        // 뷰포트 크기 계산
        const viewportElement = document.querySelector(
          '.react-flow__viewport'
        )?.parentElement;
        if (!viewportElement) return;

        const viewportWidth = viewportElement.clientWidth;
        const viewportHeight = viewportElement.clientHeight;

        // 에디터 패널 너비 (45% of viewport)
        const editorPanelWidth = viewportWidth * 0.45;

        // 가용 공간 계산
        // 뷰포트 좌측 끝 + 100px + 노드 너비 + 100px + 에디터 패널 너비 = 뷰포트 우측 끝
        // 가용 너비 = 뷰포트 너비 - 100px - 100px - 에디터 패널 너비
        const padding = 100; // 좌우 패딩
        const availableWidth = viewportWidth - padding * 2 - editorPanelWidth;

        // 노드의 실제 크기
        const nodeWidth = node.width || 200;
        const nodeHeight = node.height || 100;

        // 필요한 줌 레벨 계산
        // 노드가 가용 공간에 딱 맞도록 줌 조정
        const requiredZoom = availableWidth / nodeWidth;

        // 줌 레벨 제한 (너무 크거나 작지 않도록)
        const targetZoom = Math.min(Math.max(requiredZoom, 0.3), 2.0);

        // 줌이 적용된 노드의 실제 화면 크기
        const scaledNodeWidth = nodeWidth * targetZoom;
        const scaledNodeHeight = nodeHeight * targetZoom;

        // 노드가 위치할 화면상의 중심점 계산
        // 뷰포트 좌측 끝 + 100px + (노드 너비 / 2)
        const screenCenterX = padding + scaledNodeWidth / 2;
        const screenCenterY = viewportHeight / 2; // 수직 중앙

        // 현재 뷰포트 정보
        const viewport = getViewport();

        // 화면 좌표를 React Flow 좌표로 변환
        // screenX = (flowX - viewport.x) * zoom
        // flowX = (screenX / zoom) + viewport.x
        const targetFlowX = screenCenterX / targetZoom;
        const targetFlowY = screenCenterY / targetZoom;

        // 노드의 실제 중심 좌표
        const nodeCenterX = node.position.x + nodeWidth / 2;
        const nodeCenterY = node.position.y + nodeHeight / 2;

        // 뷰포트를 노드 중심으로 이동하되, 계산된 화면 위치에 배치
        // setCenter는 React Flow 좌표를 화면 중앙에 배치하므로,
        // 우리가 원하는 화면 위치로 오프셋 적용
        const offsetX = (viewportWidth / 2 - screenCenterX) / targetZoom;
        const targetX = nodeCenterX + offsetX;
        const targetY = nodeCenterY;

        // 애니메이션과 함께 중앙 이동
        setCenter(targetX, targetY, {
          zoom: targetZoom,
          duration: 500,
        });
      }

      return () => {
        clearTimeout(timer);
      };
    } else {
      // Hide: Start slide-out animation
      setIsAnimating(false);
      // Wait for animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, blockId, getNode, setCenter, getZoom, getViewport]);

  // Title 업데이트 핸들러
  const handleTitleSave = async () => {
    if (!blockData || !title.trim()) {
      return;
    }

    const trimmedTitle = title.trim();
    const blockIdValue = (blockData.blockId as string) || blockId;

    try {
      // Optimistic update
      const originalTitle = blockData.title;

      // React Flow Store 즉시 업데이트
      const updatedData = {
        ...blockData,
        title: trimmedTitle,
      };

      if (blockNode) {
        updateNode(blockId, { data: updatedData });
      }

      // Server action 호출
      const result = await updateBlockTitleAction({
        blockId: blockIdValue,
        title: trimmedTitle,
        pageId: blockData.pageId as string | undefined,
        orgId: blockData.orgId as string | undefined,
        workspaceId: blockData.workspaceId as string | undefined,
      });

      if (!result.success) {
        // 실패 시 롤백
        if (blockNode) {
          updateNode(blockId, {
            data: { ...blockData, title: originalTitle },
          });
        }
        console.error('Failed to update title:', result.error);
        // 원래 title로 되돌림
        setTitle((originalTitle as string) || '새 블럭');
      }
    } catch (error) {
      console.error('Failed to update title:', error);
      // 에러 발생 시 원래 title로 되돌림
      setTitle((blockData.title as string) || '새 블럭');
    }
  };

  // Enter 키로 저장
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setTitle((blockData?.title as string) || '새 블럭');
      inputRef.current?.blur();
    }
  };

  // 포커스 아웃 시 저장
  const handleBlur = () => {
    handleTitleSave();
  };

  if (!shouldRender || !blockData) return null;

  return (
    <div
      className={`absolute bottom-0 right-0 z-50 w-[50%] h-[85%] bg-background/70 backdrop-blur-md border-l border-t border-border shadow-2xl rounded-tl-lg transition-all duration-300 ease-out ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-panel-title"
    >
      <div className="flex flex-col h-full">
        {/* Modal Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 transition-all duration-200 hover:bg-accent/50 hover:scale-105 active:scale-95 group"
              onClick={() => canvasMode.exitToDefaultMode()}
              aria-label="Close editor panel"
            >
              <ChevronsRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => {
                console.log('Expand modal');
              }}
              aria-label="Expand panel"
            >
              <Expand className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => {
                console.log('Share');
              }}
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => {
                console.log('More options');
              }}
              aria-label="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Title Section */}
          <div className="p-4">
            <Input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="h-10 px-0 text-2xl md:text-3xl font-semibold border-none bg-transparent focus-visible:ring-0 shadow-none"
              placeholder="제목 없음"
              maxLength={100}
            />
          </div>

          {/* Block Properties (Schema-based) */}
          <BlockPropertiesSection blockId={blockId} blockData={blockData} />
        </div>
      </div>
    </div>
  );
}
