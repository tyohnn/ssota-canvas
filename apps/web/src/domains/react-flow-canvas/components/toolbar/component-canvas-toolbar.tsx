"use client";

import React from "react";
import { useReactFlow } from "@xyflow/react";
import { Button } from "@workspace/ui/components/ui/button";
import {
  Tooltip,
  TooltipContent, 
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";
import { Separator } from "@workspace/ui/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/ui/dialog";
import {
  Edit3,
  ArrowLeft,
  MousePointer,
  Hand,
  Maximize,
  Trash2,
} from "lucide-react";
import { useReactFlowCommandsContext } from "@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { usePanel } from "@/domains/react-flow-canvas/contexts/PanelContext";
import { useControlState, useControlCommands } from "@/domains/react-flow-canvas/contexts/ControlContext";
import { useReactFlowNodeSelection, useReactFlowSelectionCommands } from "@/domains/react-flow-canvas/contexts/ReactFlowSelectionContext";

export function ComponentCanvasToolbar() {
  const reactFlow = useReactFlow();
  const { selectedComponentBlock, selectComponent, selectedComponentId } = useCanvasData();
  const commands = useReactFlowCommandsContext();
  const panel = usePanel();
  const { toolMode } = useControlState();
  const { setToolMode } = useControlCommands();
  const { clearSelection, selectNodes } = useReactFlowSelectionCommands();
  const { selectedSingleNode } = useReactFlowNodeSelection();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // 컴포넌트 정보 계산
  const componentName = selectedComponentBlock?.title || null;
  const isEditOpen = panel.showEditorPanel;
  const toggleEdit = () => {
    if (isEditOpen) {
      panel.closeEditorPanel();
    } else {
      panel.openEditorPanel();
    }
  };

  // Fit to View 함수
  const handleFitToView = React.useCallback(() => {
    reactFlow.fitView({ duration: 200, padding: 0.1 });
  }, [reactFlow]);

  // Enhanced back to page handler
  const handleBackToPage = () => {
    // Canvas Data Context
    selectComponent(null);
    
    // React Flow Canvas Context
    clearSelection();

    // Close editor panel
    panel.closeEditorPanel();

    // Clear selected component
    // Switch to layer tab
    panel.setActiveExplorerTab("layers");
  };

  // Keyboard event handler
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if not typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }

      // Ignore system shortcuts but allow Shift
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      switch (event.code) {
        case "KeyV":
          event.preventDefault();
          event.stopPropagation();
          setToolMode("select");
          break;
        case "KeyH":
          event.preventDefault();
          event.stopPropagation();
          setToolMode("hand");
          break;
        case "KeyF":
          event.preventDefault();
          event.stopPropagation();
          handleFitToView();
          break;
      }
    };

    // Use capture phase to ensure we get the event before React Flow
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [setToolMode, handleFitToView, selectedComponentId]);

  
  const optimisticRollback = (currentSelectedComponentId: string) => {
    selectComponent(currentSelectedComponentId);
    selectNodes([currentSelectedComponentId]);
    panel.openEditorPanel();
    panel.setActiveExplorerTab("assets");
  };

  const handleDelete = async () => {
    if (!selectedSingleNode) return;
    const currentSelectedComponentId = selectedSingleNode.id;
    setIsDeleting(true);

    // Optimistic UI 업데이트 (즉시 실행)
    // Canvas Data Context
    selectComponent(null);

    // React Flow Canvas Context
    clearSelection();
    panel.closeEditorPanel();
    panel.setActiveExplorerTab("layers");
    setShowDeleteModal(false);

    try {
      const result = await commands.deleteComponent(selectedSingleNode);
      if (!result.ok) {
        console.error("Failed to delete component:", result.error);
        // TODO: 사용자에게 에러 알림 (토스트 등)
        optimisticRollback(currentSelectedComponentId);
      } else {
        console.log("✅ Component deleted successfully:", result.data);
      }
    } catch (error) {
      console.error("Failed to delete component:", error);
      optimisticRollback(currentSelectedComponentId);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background/70 backdrop-blur-md border border-border/50 rounded-lg shadow-xl">
          {/* Left side - Back button and component name */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 rounded-md"
            onClick={handleBackToPage}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to page
          </Button>

          <Separator orientation="vertical" className="h-4" />

          {/* Center - Tool buttons */}
          <TooltipProvider>
            {/* Selection Tool */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={toolMode === "select" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-md"
                  onClick={() => setToolMode("select")}
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Select (V)</p>
              </TooltipContent>
            </Tooltip>

            {/* Hand Tool */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={toolMode === "hand" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-md"
                  onClick={() => setToolMode("hand")}
                >
                  <Hand className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Hand (H)</p>
              </TooltipContent>
            </Tooltip>

            {/* Fit to View Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFitToView}
                  className="h-8 w-8 p-0 rounded-md"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Fit to View (F)</p>
              </TooltipContent>
            </Tooltip>

            <Separator
              orientation="vertical"
              className="mx-1 data-[orientation=vertical]:h-4"
            />

            {/* Edit Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isEditOpen ? "default" : "ghost"}
                  size="sm"
                  onClick={toggleEdit}
                  className="h-8 w-8 p-0 rounded-md"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Edit Component</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-4" />

          {/* Right side - Delete button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-md text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Delete Component</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Component</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{componentName}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
