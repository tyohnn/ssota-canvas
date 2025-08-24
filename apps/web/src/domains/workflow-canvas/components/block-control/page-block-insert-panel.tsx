"use client";

import React from "react";
import { Button } from "@workspace/ui/components/ui/button";
import { useCanvas } from "@/domains/workflow-canvas/contexts/CanvasContext";
import {
  PAGE_BLOCK_DATA,
  PageBlockData,
  getBlockColorClasses,
} from "@/domains/workflow-canvas/policy";
import { BlockType } from "@workspace/domain-contracts";

interface PageBlockInsertPanelProps {
  className?: string;
}

export function PageBlockInsertPanel({ className }: PageBlockInsertPanelProps) {
  const {
    showPageBlockInsertPanel: isOpen,
    handlePageBlockCreate,
    closeAllPanels,
  } = useCanvas();

  if (!isOpen) return null;

  const handlePageBlockSelect = (type: BlockType) => {
    handlePageBlockCreate(type);
    closeAllPanels();
  };

  // Close Button Component
  const CloseButton = () => (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0"
      onClick={closeAllPanels}
    >
      <svg
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </Button>
  );

  // Header Component
  const HeaderComponent = () => (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold">Add Page</h3>
      <CloseButton />
    </div>
  );

  // Page Block Item Component
  const PageBlockItem = ({ pageBlock }: { pageBlock: PageBlockData }) => {
    const colors = getBlockColorClasses(pageBlock.color);

    return (
      <div
        className="p-3 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
        onClick={() => handlePageBlockSelect(pageBlock.id)}
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-lg p-1.5 rounded-md ${colors.bg500} text-muted border-1 border-muted`}
          >
            {React.createElement(pageBlock.icon, { className: "h-4 w-4" })}
          </span>
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">{pageBlock.title}</h4>
            <p className="text-xs text-muted-foreground">
              {pageBlock.description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Page Block List Component
  const PageBlockList = () => (
    <div className="space-y-2 overflow-y-auto">
      {PAGE_BLOCK_DATA.map((pageBlock) => (
        <PageBlockItem key={pageBlock.id} pageBlock={pageBlock} />
      ))}
    </div>
  );

  return (
    <div
      className={`bg-background border-r border-border flex flex-col h-full ${className}`}
    >
      <div className="p-3 animate-in fade-in-0 slide-in-from-right-4 duration-300 ease-out">
        <HeaderComponent />
        <PageBlockList />
      </div>
    </div>
  );
}
