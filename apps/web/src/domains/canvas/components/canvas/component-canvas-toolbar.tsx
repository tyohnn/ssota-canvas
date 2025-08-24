"use client";

import React from "react";
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
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import { useUiLayout } from "@/domains/canvas/contexts/UiLayoutContext";

export type ComponentCanvasToolMode = "select" | "hand";

type ComponentCanvasToolbarProps = {
  onBackToPage: () => void;
  isEditOpen: boolean;
  toggleEdit: () => void;
  componentName?: string | null;
  toolMode: ComponentCanvasToolMode;
  setToolMode: (mode: ComponentCanvasToolMode) => void;
  onFitToView?: () => void;
};

export function ComponentCanvasToolbar({
  onBackToPage,
  isEditOpen,
  toggleEdit,
  componentName,
  toolMode,
  setToolMode,
  onFitToView,
}: ComponentCanvasToolbarProps) {
  const commands = useCanvasCommandsContext();
  const sel = useCanvasSelection();
  const ui = useUiLayout();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Enhanced back to page handler
  const handleBackToPage = () => {
    // Close editor panel
    ui.closeEditorPanel();
    // Clear selected component
    sel.selectComponent(null);
    // Clear node selection to prevent editor from reopening
    sel.setNodeSelection([]);
    // Switch to layer tab
    ui.setActiveLeftTab("layers");
    // Call the original onBackToPage
    onBackToPage();
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
          onFitToView?.();
          break;
      }
    };

    // Use capture phase to ensure we get the event before React Flow
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [setToolMode, onFitToView]);

  const handleDelete = async () => {
    if (!sel.componentId) return;

    setIsDeleting(true);

    // Optimistic UI 업데이트 (즉시 실행)
    ui.closeEditorPanel();
    ui.setActiveLeftTab("layers");
    setShowDeleteModal(false);

    try {
      const result = await commands.deleteComponent(sel.componentId);
      if (!result.ok) {
        console.error("Failed to delete component:", result.error);
        // TODO: 사용자에게 에러 알림 (토스트 등)
        // UI 롤백은 deleteComponent 내부에서 이미 처리됨 (selectComponent(null))
      }
    } catch (error) {
      console.error("Failed to delete component:", error);
      // UI 롤백은 deleteComponent 내부에서 이미 처리됨
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
                  onClick={onFitToView}
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
