"use client";

import React, { useCallback } from "react";
import {
  NodeResizer,
  NodeResizeControl,
  Handle,
  Position,
  useReactFlow,
  NodeToolbar,
  useKeyPress,
} from "@xyflow/react";
import { Button } from "@workspace/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@workspace/ui/components/ui/dropdown-menu";
import {
  MoreVertical,
  Pencil,
  Copy,
  Plus,
  Trash2,
  Unlink,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import { useReactFlowCanvasControl } from "@/domains/react-flow-canvas/hooks/useReactFlowCanvasControl";
import { isComponentInstance } from "@/domains/canvas/types/component";
import { Separator } from "@workspace/ui/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";
import { usePanel } from "../contexts/PanelContext";
import { useSelectionCommands, useNodeSelection, useSelectionState } from "../contexts/SelectionContext";

type MenuItem = {
  label: string;
  onClick: () => void;
  variant?: "destructive" | "default";
};

type NodeChromeProps = {
  id: string;
  selected?: boolean;
  width: number;
  height: number;
  extraMenuItems?: MenuItem[];
  children: React.ReactNode;
  showHandles?: boolean;
  // NodeToolbar 관련 props
  toolbarItems?: React.ReactNode;
  showToolbar?: boolean;
  // Resizer 관련 props
  resizerColor?: string;
  // 리사이즈 시 종횡비 유지 여부 (기본값: false)
  keepAspectRatio?: boolean;
  // 리사이즈 이벤트 핸들러
  onResize?: (event: any, data: { width: number; height: number }) => void;
  // 드래그 가능 여부 (기본값: true)
  draggable?: boolean;
};

export function NodeChrome({
  id,
  selected,
  width,
  height,
  extraMenuItems,
  children,
  showHandles = true,
  toolbarItems,
  showToolbar = true,
  resizerColor = "#94a3b8",
  keepAspectRatio = false,
  onResize,
  draggable = true,
}: NodeChromeProps) {
  const panel = usePanel();
  // React Flow selected prop이 우선, SelectionContext는 드래그 선택 상태만 사용
  const { isSingleSelected } = useNodeSelection();
  const selectionCommands = useSelectionCommands();
  const { canvasMode } = useCanvasSelection();
  
  const rf = useReactFlow();
  const commands = useCanvasCommandsContext();
  const { focusOnNode } = useReactFlowCanvasControl();
  
  // 드래그 선택 상태 소비 (임시로 useSelectionState 사용)
  const { dragSelection } = useSelectionState();
  
  // 노드 참조 (드래그 박스 교차 확인용)
  const nodeRef = React.useRef<HTMLDivElement>(null);

  // 컴포넌트 모드인지 확인 (현재 선택된 컴포넌트가 있는지)
  const isComponentMode = canvasMode === "component";

  // 현재 블록이 컴포넌트 인스턴스인지 확인 (props로 전달받은 데이터 사용)
  // TODO: 컴포넌트 인스턴스 확인 로직을 props나 다른 방법으로 처리
  const isInstance = false; // 임시로 false로 설정

  
  // 툴바 표시 조건: React Flow selected prop이 true이고 단일 선택일 때
  const shouldShowToolbar = selected && isSingleSelected;
  
  // 드래그 박스와의 교차 확인
  const isInDragBox = React.useMemo(() => {
    if (!dragSelection.isDragging || !dragSelection.selectionBox || !nodeRef.current) {
      return false;
    }
    
    const nodeRect = nodeRef.current.getBoundingClientRect();
    const { start, current } = dragSelection.selectionBox;
    
    // 선택 박스의 경계 계산
    const left = Math.min(start.x, current.x);
    const right = Math.max(start.x, current.x);
    const top = Math.min(start.y, current.y);
    const bottom = Math.max(start.y, current.y);
    
    // 노드가 선택 박스 안에 완전히 포함되는지 확인
    return (
      nodeRect.left >= left &&
      nodeRect.right <= right &&
      nodeRect.top >= top &&
      nodeRect.bottom <= bottom
    );
  }, [dragSelection.isDragging, dragSelection.selectionBox]);
  
  // 드래그 중 임시 선택 상태
  const isTempSelected = dragSelection.tempSelectedIds.includes(id);

  // ESC 키 감지
  const escapePressed = useKeyPress('Escape');

  // ESC 키를 눌렀을 때 선택 해제
  React.useEffect(() => {
    if (escapePressed && selected) {
      selectionCommands.clearSelection();
    }
  }, [escapePressed, selected, selectionCommands]);

  // node handlers
  const handleDelete = useCallback(async () => {
    // Optimistic: 즉시 에디터 닫기
    panel.closeEditorPanel();

    // 백그라운드에서 삭제 작업 진행
    const result = await commands.deleteBlock(id);
    if (!result.ok) {
      console.error("Failed to delete block:", result.error);
      // TODO: 사용자에게 에러 알림 (토스트 등) - 에디터는 이미 닫혀있음
    }
  }, [id, commands, panel.closeEditorPanel]);

  const handleDuplicate = useCallback(async () => {
    const result = await commands.duplicateBlock(id);
    if (!result.ok) {
      console.error("Failed to duplicate block:", result.error);
      // TODO: 사용자에게 에러 알림 (토스트 등)
    }
  }, [id, commands]);

  const handleEdit = useCallback(
    () => {
      panel.openEditorPanel();
    },
    [panel.openEditorPanel]
  );

  const handleCreateComponent = useCallback(async () => {
    // 블록 정보는 commands에서 처리하도록 수정
    const result = await commands.promoteBlockToComponentDefinition(id);

    if (result.ok) {
      panel.setActiveExplorerTab("assets");
    } else {
      // TODO: 사용자에게 에러 알림 (토스트 등)
    }
  }, [id, commands, panel.setActiveExplorerTab]);

  const handleDetachComponent = useCallback(async () => {
    const result = await commands.detachComponentInstance(id);
    if (!result.ok) {
      console.error("Failed to detach component:", result.error);
      // TODO: 사용자에게 에러 알림 (토스트 등)
    }
  }, [id, commands]);

  // ">>" 버튼 활성화 상태 확인 - React Flow selected prop 우선
  const isDetailsButtonActive = panel.showEditorPanel && selected;

  const handleFocusAndEdit = useCallback(() => {
    if (isDetailsButtonActive) {
      // 활성화 상태에서는 에디터 닫기
      panel.closeEditorPanel();
    } else {
      // 비활성화 상태에서는 노드 선택 및 에디터 열기
      selectionCommands.selectNodes([id]);
      panel.openEditorPanel();
      // focusOnNode를 사용하여 노드로 viewport 이동
      setTimeout(() => {
        focusOnNode(id);
      }, 50);
    }
  }, [id, selectionCommands, panel.openEditorPanel, panel.closeEditorPanel, isDetailsButtonActive, focusOnNode]);

  // 키보드 단축키 처리
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const tag = (target?.tagName || "").toLowerCase();
    const isEditable =
      target?.isContentEditable ||
      tag === "input" ||
      tag === "textarea" ||
      tag === "select";
    
    if (isEditable) return;

    const isMeta = e.metaKey || e.ctrlKey;

    // Edit: Cmd/Ctrl+E
    if (isMeta && (e.key === "e" || e.key === "E")) {
      e.preventDefault();
      handleEdit();
      return;
    }

    // Duplicate: Cmd/Ctrl+D
    if (isMeta && (e.key === "d" || e.key === "D")) {
      e.preventDefault();
      handleDuplicate();
      return;
    }

    // Create Component: Shift+Cmd/Ctrl+C
    if (isMeta && e.shiftKey && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
      handleCreateComponent();
      return;
    }

    // Delete: Backspace or Delete
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      handleDelete();
      return;
    }
  }, [handleEdit, handleDuplicate, handleCreateComponent, handleDelete]);

  // 키보드 이벤트 리스너 등록
  React.useEffect(() => {
    // 컴포넌트 모드에서는 키보드 단축키 비활성화
    if (!selected || isComponentMode) return;
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, isComponentMode, handleKeyDown]);

  return (
    <div
      ref={nodeRef}
      className="relative flex items-center justify-center"
      style={{ 
        width, 
        height,
        cursor: draggable ? 'grab' : 'default',
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* NodeToolbar - 기본 아이템들 */}
      {showToolbar && (
        <NodeToolbar
          isVisible={shouldShowToolbar}
          position={Position.Top}
          className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/70 px-2 py-1 shadow-xl backdrop-blur-md nodrag nowheel"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 추가 툴바 아이템들 (먼저 렌더링) */}
          {toolbarItems}

          {/* Focus and Edit Button */}
          <Separator
            orientation="vertical"
            className="mx-1 data-[orientation=vertical]:h-4"
          />
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={isDetailsButtonActive ? "default" : "ghost"}
                size="sm"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleFocusAndEdit}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isDetailsButtonActive ? "rotate-180" : "rotate-0"
                  }`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Details</TooltipContent>
          </Tooltip>
          {/* 기본 툴바 아이템들 - 드롭다운으로 통합 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onMouseDown={(e) => e.stopPropagation()}
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              className="nodrag nowheel border border-border/50 bg-background/70 px-1 py-1 shadow-xl backdrop-blur-md"
            >
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
                <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
                <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
              </DropdownMenuItem>
              {isInstance ? (
                <DropdownMenuItem onClick={handleDetachComponent}>
                  <Unlink className="h-4 w-4 mr-2" />
                  Detach Component
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleCreateComponent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Component
                  <DropdownMenuShortcut>⇧⌘C</DropdownMenuShortcut>
                </DropdownMenuItem>
              )}
              {extraMenuItems?.length ? (
                <>
                  <DropdownMenuSeparator />
                  {extraMenuItems.map((m) => (
                    <DropdownMenuItem
                      key={m.label}
                      onClick={m.onClick}
                      variant={m.variant}
                    >
                      {m.label}
                    </DropdownMenuItem>
                  ))}
                </>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
                <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </NodeToolbar>
      )}

      <NodeResizer
        color={resizerColor}
        isVisible={!!selected}
        minWidth={80}
        minHeight={40}
        keepAspectRatio={keepAspectRatio}
        handleStyle={{ width: 10, height: 10 }}
        lineStyle={{ strokeWidth: 1 }}
        onResize={onResize}
      />
      <NodeResizeControl
        style={{ background: "transparent", border: "none" }}
        minWidth={80}
        minHeight={40}
        keepAspectRatio={keepAspectRatio}
        onResize={onResize}
      />

      {children}

      {showHandles && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            style={{ opacity: 0.5, width: 10, height: 10 }}
          />
          <Handle
            type="source"
            position={Position.Right}
            style={{ opacity: 0.5, width: 10, height: 10 }}
          />
        </>
      )}
    </div>
  );
}
