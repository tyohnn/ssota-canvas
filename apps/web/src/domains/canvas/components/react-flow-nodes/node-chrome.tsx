"use client";

import React, { useCallback } from "react";
import {
  NodeResizer,
  NodeResizeControl,
  Handle,
  Position,
  useReactFlow,
  NodeToolbar,
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
  ChevronsRight,
} from "lucide-react";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { useUiLayout } from "@/domains/canvas/contexts/UiLayoutContext";
import { useEditorControlContext } from "@/domains/canvas/contexts/EditorControlContext";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import { isComponentInstance } from "@/domains/canvas/types/component";
import { Separator } from "@workspace/ui/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";

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
}: NodeChromeProps) {
  const rf = useReactFlow();
  const data = useCanvasData();
  const sel = useCanvasSelection();
  const ui = useUiLayout();
  const commands = useCanvasCommandsContext();
  const { openEditor, closeEditor } = useEditorControlContext();

  // 컴포넌트 모드인지 확인 (현재 선택된 컴포넌트가 있는지)
  const isComponentMode = !!sel.componentId;

  // 현재 블록이 컴포넌트 인스턴스인지 확인
  const currentBlock = data.blocksById[id];
  const isInstance = currentBlock ? isComponentInstance(currentBlock) : false;

  const handleDelete = useCallback(async () => {
    // Optimistic: 즉시 에디터 닫기
    closeEditor();

    // 백그라운드에서 삭제 작업 진행
    const result = await commands.deleteBlock(id);
    if (!result.ok) {
      console.error("Failed to delete block:", result.error);
      // TODO: 사용자에게 에러 알림 (토스트 등) - 에디터는 이미 닫혀있음
    }
  }, [id, commands, closeEditor]);

  const handleDuplicate = useCallback(async () => {
    const result = await commands.duplicateBlock(id);
    if (!result.ok) {
      console.error("Failed to duplicate block:", result.error);
      // TODO: 사용자에게 에러 알림 (토스트 등)
    }
  }, [id, commands]);

  const handleEdit = useCallback(
    (blockId: string) => {
      openEditor(blockId);
    },
    [openEditor]
  );

  const handleCreateComponent = useCallback(async () => {
    const src = data.blocksById[id];
    if (!src) {
      console.error("Block not found:", id);
      return;
    }

    const result = await commands.promoteBlockToComponentDefinition(id);

    if (result.ok) {
      ui.setActiveLeftTab("assets");
    } else {
      // TODO: 사용자에게 에러 알림 (토스트 등)
    }
  }, [id, data.blocksById, commands, ui.setActiveLeftTab]);

  const handleDetachComponent = useCallback(async () => {
    const result = await commands.detachComponentInstance(id);
    if (!result.ok) {
      console.error("Failed to detach component:", result.error);
      // TODO: 사용자에게 에러 알림 (토스트 등)
    }
  }, [id, commands]);

  const handleOpenBlockInsert = useCallback(() => {
    ui.openBlockInsertPanel();
  }, [ui.openBlockInsertPanel]);

  const handleFocusAndEdit = useCallback(() => {
    // 노드 선택 (포커싱)
    sel.setNodeSelection([id]);
    // 에디터 열기
    openEditor(id);
  }, [id, sel, openEditor]);

  // ">>" 버튼 활성화 상태 확인
  const isDetailsButtonActive = ui.showEditorPanel && sel.nodeIds.includes(id);

  React.useEffect(() => {
    // 컴포넌트 모드에서는 키보드 단축키 비활성화
    if (!selected || isComponentMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || "").toLowerCase();
      const isEditable =
        target?.isContentEditable ||
        tag === "input" ||
        tag === "textarea" ||
        tag === "select";
      if (isEditable) return;

      const isMeta = navigator.platform.toLowerCase().includes("mac")
        ? e.metaKey
        : e.ctrlKey;

      // Edit: Cmd/Ctrl+E
      if (isMeta && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        handleEdit(id);
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
        handleOpenBlockInsert();
        return;
      }

      // Delete: Backspace or Delete
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleDelete();
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    selected,
    isComponentMode,
    id,
    handleEdit,
    handleDuplicate,
    handleOpenBlockInsert,
    handleDelete,
  ]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width, height }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* NodeToolbar - 기본 아이템들 */}
      {showToolbar && (
        <NodeToolbar
          isVisible={!!selected}
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={isDetailsButtonActive ? "default" : "ghost"}
                size="sm"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleFocusAndEdit}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
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
              <DropdownMenuItem onClick={() => handleEdit(id)}>
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
