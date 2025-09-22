"use client";

import React from "react";
import type { Block } from "@/db/schema";
import { useCanvasPageCommandsContext } from "@/domains/canvas/contexts/CanvasPageCommandsContext";
import { Button } from "@workspace/ui/components/ui/button";
import { Input } from "@workspace/ui/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@workspace/ui/components/ui/tooltip";
import { Search, Plus } from "lucide-react";
import ExplorerTree from "@/domains/react-flow-canvas/explorer/explorer-tree";
import { usePageExplorerTree } from "@/domains/react-flow-canvas/components/explorer/handlers/usePageExplorerTree";

export function PageExplorerTab() {
  const commands = useCanvasPageCommandsContext();
  const [searchValue, setSearchValue] = React.useState("");

  const {
    pageBlocks,
    selectedPageBlock,
    getId,
    getName,
    getParentId,
    getOrder,
    getType,
    renderFileIcon,
    handleSelect,
    handleMove,
  } = usePageExplorerTree();

  // 검색 필터링
  const filteredBlocks = React.useMemo(() => {
    if (!searchValue) return pageBlocks;
    return pageBlocks.filter((block) =>
      block.title.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [pageBlocks, searchValue]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Search */}
      <div className="px-2 pt-3 pb-2">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="relative flex-1">
            <Input
              className="peer ps-8 h-7 md:text-[12px] placeholder:text-[12px] placeholder:text-muted-foreground/70 focus:border-muted-foreground/30 bg-transparent border-border"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              type="search"
              placeholder="Search pages..."
            />
            <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-1 flex items-center justify-center ps-1.5 peer-disabled:opacity-50">
              <Search className="size-2.5" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
      {/* <Separator /> */}
      {/* Header actions */}
      <div className="flex-1 min-h-0 flex flex-col px-2">
        <div className="flex items-center justify-between my-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            Page Explorer
          </h3>
          <div className="flex items-center gap-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-0 hover:bg-accent/50 h-6 w-6"
                  onClick={async () => {
                    await commands.createNewPage();
                  }}
                  title="Add Page"
                >
                  <Plus className="!h-3 !w-3 !text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={4}
                hasArrow={false}
                className="bg-card border-border border text-card-foreground"
              >
                <p className="text-xs font-medium">Add Page</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex-1 min-h-0 z-0 overflow-auto">
          <ExplorerTree<Block>
            sourceData={filteredBlocks}
            getId={getId}
            getName={getName}
            getParentId={getParentId}
            getOrder={getOrder}
            getType={getType}
            renderFileIcon={renderFileIcon}
            rootName="Pages"
            selectedId={selectedPageBlock?.id}
            onSelect={handleSelect}
            onMove={handleMove}
          />
        </div>
        <div className="h-4 shrink-0 w-full" aria-hidden />
      </div>
    </div>
  );
}
