"use client";

import React, { useCallback } from "react";
import {
  ChevronRight,
  ListCollapseIcon,
  ListTreeIcon,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Tree, TreeItem } from "@workspace/ui/components/origin-ui/tree";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@workspace/ui/components/tooltip";
import { PAGE_BLOCK_ICONS } from "@/domains/workflow-canvas/policy";
import {
  usePageBlockExplorerHandler,
  PageItem,
} from "@/domains/workflow-canvas/hooks";
import { ItemInstance } from "@headless-tree/core";

// Search Component - 컴포넌트 외부로 이동
interface SearchComponentProps {
  searchValue: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchComponent = React.memo(
  ({ searchValue, handleSearchChange }: SearchComponentProps) => (
    <div className="px-3 pt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="relative flex-1">
          <Input
            className="peer ps-8 h-7 md:text-[12px] placeholder:text-[12px] placeholder:text-muted-foreground/70 focus:border-muted-foreground/30 bg-transparent border-border"
            value={searchValue}
            onChange={handleSearchChange}
            type="search"
            placeholder="Search pages..."
          />
          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-1 flex items-center justify-center ps-1.5 peer-disabled:opacity-50">
            <Search className="size-2.5" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
);

SearchComponent.displayName = "SearchComponent";

interface PageBlockExplorerProps {
  className?: string;
}

export function PageBlockExplorer({ className }: PageBlockExplorerProps) {
  const {
    isLoading,
    isExpanded,
    searchValue,
    tree,
    handleSearchChange,
    handleExpandToggle,
    handleItemClick,
    handleItemKeyDown,
    openPageBlockInsertPanel,
    getItemStyles,
    indent,
  } = usePageBlockExplorerHandler();

  // Header Component
  const HeaderComponent = () => (
    <div className="flex items-center justify-between mb-3">
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
              onClick={openPageBlockInsertPanel}
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-accent/50 shrink-0 !border-border"
              onClick={handleExpandToggle}
            >
              {isExpanded ? (
                <ListCollapseIcon className="size-2.5 text-muted-foreground" />
              ) : (
                <ListTreeIcon className="size-2.5 text-muted-foreground" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={4}
            hasArrow={false}
            className="bg-card border-border border text-card-foreground"
          >
            <p className="text-xs font-medium">
              {isExpanded ? "Collapse all" : "Expand all"}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );

  // Tree Item Component
  const TreeItemComponent = ({ item }: { item: ItemInstance<PageItem> }) => {
    const itemData = item.getItemData();
    const pageType = itemData.pageType;
    const isFolder = item.isFolder();
    const isItemExpanded = isFolder ? item.isExpanded() : false;

    // 훅에서 스타일링 정보 가져오기
    const { iconColor, textColor, hoverClass, activeClass, folderClass } =
      getItemStyles(item);

    // 아이콘 컴포넌트 가져오기
    const Icon =
      pageType && pageType in PAGE_BLOCK_ICONS
        ? PAGE_BLOCK_ICONS[pageType as keyof typeof PAGE_BLOCK_ICONS]
        : null;

    return (
      <div className={`flex items-center not-last:pb-0.5 group`}>
        <TreeItem item={item} className="flex-1 not-last:pb-0" asChild>
          <div
            className={`flex items-center gap-1 py-1 px-2 rounded-sm transition-colors duration-200 w-full cursor-pointer box-border ${hoverClass} ${activeClass} ${folderClass}`}
            onClick={(e) => handleItemClick(e, item)}
            onKeyDown={(e) => handleItemKeyDown(e, item)}
            tabIndex={0}
            role="button"
            aria-expanded={isFolder ? isItemExpanded : undefined}
          >
            {Icon && <Icon className={`size-4 shrink-0 ${iconColor}`} />}
            <span
              className={`flex-1 min-w-0 text-xs font-normal text-left ${textColor}`}
            >
              {item.getItemName()}
            </span>
            {isFolder && (
              <ChevronRight
                className={`size-3.5 text-muted-foreground/60 shrink-0 transition-all duration-200 ${
                  isItemExpanded ? "rotate-90" : "rotate-0"
                }`}
              />
            )}
          </div>
        </TreeItem>
      </div>
    );
  };

  // Tree Component
  const TreeComponent = () => (
    <Tree
      // key={`${treeKey}`} // Use both keys to force re-render
      indent={indent}
      tree={tree}
      className="gap-1"
    >
      {tree.getItems().map((item: ItemInstance<PageItem>) => (
        <TreeItemComponent key={item.getId()} item={item} />
      ))}
    </Tree>
  );

  // Loading Skeleton Component
  const LoadingSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-1">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="flex items-center gap-2 py-1 px-2">
            <Skeleton className="h-3.5 w-3.5 rounded-sm" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );

  // Content Component
  const ContentComponent = () => (
    <div className="flex-1 z-0">
      {isLoading ? <LoadingSkeleton /> : <TreeComponent />}
    </div>
  );

  return (
    <div className={`flex h-full flex-col gap-3 ${className}`}>
      <SearchComponent
        searchValue={searchValue}
        handleSearchChange={handleSearchChange}
      />
      <Separator />
      <div className="flex-1 flex flex-col px-3 pb-4 overflow-auto">
        <div className="pb-0 sticky top-0 bg-background z-10">
          <HeaderComponent />
        </div>
        <ContentComponent />
      </div>
    </div>
  );
}
