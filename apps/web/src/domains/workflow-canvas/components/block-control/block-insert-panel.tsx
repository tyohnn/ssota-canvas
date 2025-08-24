"use client";

import React from "react";
import { Button } from "@workspace/ui/components/ui/button";
import { Badge } from "@workspace/ui/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/ui/components/ui/hover-card";
import { X, Info, Plus } from "lucide-react";
import { useBlockInsertPanelHandler } from "@/domains/workflow-canvas/hooks";
import {
  BlockData,
  StaticBlockDefinition,
  DynamicGroup,
  getBlockColorClasses,
} from "@/domains/workflow-canvas/policy";

interface BlockInsertPanelProps {
  className?: string;
}

export function BlockInsertPanel({ className }: BlockInsertPanelProps) {
  const {
    isOpen,
    onClose,
    selectedPageBlock,
    staticBlocks,
    dynamicGroups,
    policyDescription,
    handleBlockSelect,
    handleCreateNewBlock,
    onClickExistingBlockCard,
    isBlockConnected,
  } = useBlockInsertPanelHandler();

  if (!isOpen) return null;

  // Close Button Component
  const CloseButton = () => (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 hover:bg-accent"
      onClick={onClose}
    >
      <X className="h-3 w-3" />
    </Button>
  );

  // Header Component
  const HeaderComponent = () => {
    return (
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">
            Add{" "}
            {selectedPageBlock?.block_type
              ? `${selectedPageBlock.block_type.charAt(0).toUpperCase() + selectedPageBlock.block_type.slice(1)} `
              : ""}
            Block
          </h3>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-accent"
              >
                <Info className="h-3 w-3" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 border-border border-2">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  {policyDescription.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {policyDescription.description}
                </p>
                {policyDescription.items.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Available blocks:</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {policyDescription.items.map(
                        (item: string, index: number) => (
                          <li key={index} className="flex items-center gap-1">
                            <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <CloseButton />
      </div>
    );
  };

  // Group Header Component (simplified label style)
  const GroupHeader = ({ group }: { group: DynamicGroup }) => {
    const blocks = group.items || [];

    return (
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`p-1 rounded-md ${getBlockColorClasses(group.color).bg500} text-white [&>svg]:h-3 [&>svg]:w-3`}
        >
          <group.icon />
        </span>
        <div className="flex-1">
          <h4 className="font-medium text-xs">{group.label}</h4>
        </div>
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-bold">
          {blocks.length}
        </Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-accent"
                onClick={() => handleCreateNewBlock(group.id)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={4}
              className="bg-card border-border border-2 text-card-foreground"
              hasArrow={false}
            >
              <p className="text-xs">Create New {group.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  // Existing Block Card Component
  const ExistingBlockCard = ({
    block,
    group,
  }: {
    block: BlockData;
    group: DynamicGroup;
  }) => {
    const isConnected = isBlockConnected(block.id);

    return (
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
          isConnected
            ? "opacity-50 cursor-not-allowed bg-muted"
            : "hover:bg-accent/50 cursor-pointer border-dashed border border-muted-foreground"
        }`}
        onClick={
          isConnected ? undefined : () => onClickExistingBlockCard(block.id)
        }
      >
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-medium truncate ${
              isConnected ? "text-muted-foreground" : ""
            }`}
            title={block.name || block.data?.label || block.id}
          >
            {block.name || block.data?.label || block.id}
            {isConnected && " (Connected)"}
          </p>
          {(block.description || block.data?.description) && (
            <p
              className="text-[10px] text-muted-foreground truncate"
              title={block.description || block.data?.description}
            >
              {block.description || block.data?.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Empty State Component
  const EmptyState = ({ group }: { group: DynamicGroup }) => (
    <div className="p-2 text-center text-muted-foreground text-[10px]">
      No existing {group.label.toLowerCase()} found
    </div>
  );

  // Group Content Component
  const GroupContent = ({ group }: { group: DynamicGroup }) => {
    const blocks = group.items || [];

    return (
      <div className="space-y-1">
        <GroupHeader group={group} />
        <div className="space-y-1">
          {blocks.map((block: BlockData) => (
            <ExistingBlockCard key={block.id} block={block} group={group} />
          ))}
          {blocks.length === 0 && <EmptyState group={group} />}
        </div>
      </div>
    );
  };

  // Static Block Card Component
  const StaticBlockCard = ({ block }: { block: StaticBlockDefinition }) => (
    <div
      className="flex items-center gap-2 px-1 py-1 rounded-md hover:bg-accent cursor-pointer transition-colors"
      onClick={() => handleBlockSelect(block.id)}
    >
      <span
        className={`p-1 rounded-md ${getBlockColorClasses(block.color).bg500} text-white [&>svg]:h-3 [&>svg]:w-3`}
      >
        <block.icon />
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-xs truncate" title={block.name}>
          {block.name}
        </h4>
        <p
          className="text-[10px] text-muted-foreground truncate"
          title={block.description}
        >
          {block.description}
        </p>
      </div>
    </div>
  );

  // Static Blocks List Component
  const StaticBlocksList = () => (
    <div className="space-y-1">
      {staticBlocks.length > 0 && (
        <div className="mb-2">
          <h4 className="text-xs font-medium mb-2">Basic Blocks</h4>
          <div className="space-y-1">
            {staticBlocks.map((block) => (
              <StaticBlockCard key={block.id} block={block} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Block Groups List Component
  const BlockGroupsList = () => (
    <div className="space-y-4">
      {dynamicGroups.length > 0 && (
        <div className="mb-2">
          <h4 className="text-xs font-medium mb-2">Page Blocks</h4>
          <div className="space-y-4">
            {dynamicGroups.map((group) => (
              <GroupContent key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}
      {dynamicGroups.length === 0 && staticBlocks.length === 0 && (
        <div className="text-center text-muted-foreground text-xs">
          No blocks available for this canvas type
        </div>
      )}
    </div>
  );

  // Content Component
  const ContentComponent = () => (
    <div className="flex-1 overflow-y-auto space-y-6">
      <StaticBlocksList />
      <BlockGroupsList />
    </div>
  );

  return (
    <div
      className={`bg-background border-r border-border flex flex-col h-full ${className}`}
    >
      <div className="p-3 animate-in fade-in-0 slide-in-from-right-4 duration-300 ease-out">
        <HeaderComponent />
        <ContentComponent />
      </div>
    </div>
  );
}
