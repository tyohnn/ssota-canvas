"use client";

import React from "react";
import { NodeToolbar, Position, Node } from "@xyflow/react";
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
} from "lucide-react";
import { Separator } from "@workspace/ui/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";
import { usePanel } from "@/domains/react-flow-canvas/contexts/PanelContext";
import { useReactFlowNodeSelection, useReactFlowSelectionCommands } from "@/domains/react-flow-canvas/contexts/ReactFlowSelectionContext";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useReactFlowCommandsContext } from "@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext";
import { useReactFlowCanvasControl } from "@/domains/react-flow-canvas/handlers/useReactFlowCanvasControlHandler";

type MenuItem = {
  label: string;
  onClick: () => void;
  variant?: "destructive" | "default";
};

type NodeTopToolbarProps = {
  node: Node;
  toolbarItems?: React.ReactNode;
  extraMenuItems?: MenuItem[];
};

export function NodeTopToolbar({
  node,
  toolbarItems,
  extraMenuItems,
}: NodeTopToolbarProps) {
  const panel = usePanel();
  const { selectNodes } = useReactFlowSelectionCommands();
  const { isSingleSelected } = useReactFlowNodeSelection();
  const { contextBlockId } = useCanvasData();
  const { nodeCommands, componentCommands } = useReactFlowCommandsContext();
  const { focusOnNode } = useReactFlowCanvasControl();

  // 툴바 표시 조건: React Flow selected prop이 true이고 단일 선택일 때
  const selected = node.selected;
  const shouldShowToolbar = selected && isSingleSelected;
  const nodeId = node.id;
  const isInstance = node.data.role === "instance";

  // ">>" 버튼 활성화 상태 확인
  const isDetailsButtonActive = panel.showEditorPanel && selected;

  const handleDelete = React.useCallback(async () => {
    // Optimistic: 즉시 에디터 닫기
    panel.closeEditorPanel();

    // 백그라운드에서 삭제 작업 진행
    const result = await nodeCommands.deleteNodes([node]);
    if (!result.ok) {
      console.error("Failed to delete block:", result.error);
    }
  }, [node, nodeCommands, panel.closeEditorPanel]);


  const handleDuplicate = React.useCallback(async () => {
    const result = await nodeCommands.duplicateNodes(contextBlockId as string, [node]);
    if (!result.ok) {
      console.error("Failed to duplicate block:", result.error);
    }
  }, [node, contextBlockId, nodeCommands]);


  const handleEdit = React.useCallback(() => {
    panel.openEditorPanel();
  }, [panel.openEditorPanel]);

  const handleCreateComponent = React.useCallback(async () => {
    const result = await componentCommands.createComponentFromNode(node);

    if (result.ok) {
      panel.setActiveExplorerTab("assets");
    }
  }, [nodeId, componentCommands, panel.setActiveExplorerTab]);


  const handleDetachComponent = React.useCallback(async () => {
    const result = await componentCommands.detachComponentInstance(node);
    if (!result.ok) {
      console.error("Failed to detach component:", result.error);
    }
  }, [nodeId, componentCommands]);


  const handleFocusAndEdit = React.useCallback(() => {
    if (isDetailsButtonActive) {
      // 활성화 상태에서는 에디터 닫기
      panel.closeEditorPanel();
    } else {
      // 비활성화 상태에서는 노드 선택 및 에디터 열기
      selectNodes([nodeId]);
      panel.openEditorPanel();
      // focusOnNode를 사용하여 노드로 viewport 이동
      setTimeout(() => {
        focusOnNode(nodeId);
      }, 50);
    }
  }, [nodeId, selectNodes, panel.openEditorPanel, panel.closeEditorPanel, isDetailsButtonActive, focusOnNode]);

  return (
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
  );
}
