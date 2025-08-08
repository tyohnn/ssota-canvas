"use client";

import React, { useCallback } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@workspace/ui/components/tooltip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Eye,
  EyeOff,
  Search,
  ListCollapseIcon,
  ListTreeIcon,
} from "lucide-react";
import { useBlockLayerExplorerHandler } from "@/domains/workflow-canvas/hooks";
import {
  PAGE_BLOCK_ICONS,
  PAGE_BLOCK_COLOR_TOKENS,
  PageBlockType,
} from "@/domains/workflow-canvas/policy";

interface BlockLayerExplorerProps {
  className?: string;
}

// SearchAndToggle Component - 컴포넌트 외부로 이동
interface SearchAndToggleProps {
  searchValue: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isExpanded: boolean;
  handleToggleExpanded: () => void;
}

const SearchAndToggle = React.memo(
  ({
    searchValue,
    handleSearchChange,
    isExpanded,
    handleToggleExpanded,
  }: SearchAndToggleProps) => (
    <div className="px-3 pt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="relative flex-1">
          <Input
            className="peer ps-8 h-7 md:text-[12px] placeholder:text-[12px] placeholder:text-muted-foreground/70 focus:border-muted-foreground/30 bg-transparent border-border"
            value={searchValue}
            onChange={handleSearchChange}
            type="search"
            placeholder="Search layers..."
          />
          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-1 flex items-center justify-center ps-1.5 peer-disabled:opacity-50">
            <Search className="size-2.5" aria-hidden="true" />
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 hover:bg-accent/50 shrink-0 !border-border"
              onClick={handleToggleExpanded}
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
  )
);

SearchAndToggle.displayName = "SearchAndToggle";

export function BlockLayerExplorer({ className }: BlockLayerExplorerProps) {
  const {
    // 상태
    isExpanded,
    searchValue,
    filteredItems,
    pageOptions,
    hasItems,
    selectedPageBlock,

    // 이벤트 핸들러
    handleVisibilityToggle,
    handleSearchChange,
    handleToggleExpanded,
    onPageValueChange,
    handleBlockItemClick,

    // 상수
    PAGE_GROUPS,
  } = useBlockLayerExplorerHandler();

  // 아이콘 색상 결정 함수
  const getIconColor = (pageType: PageBlockType) => {
    const colorToken = PAGE_BLOCK_COLOR_TOKENS[pageType];
    if (!colorToken) return "text-muted-foreground";
    return `text-${colorToken}-500`;
  };

  // Active 상태 배경색 결정 함수 (일반 색상으로 변경)
  const getActiveBackgroundClass = (token: string) => {
    return "bg-accent border-border";
  };

  // Hover 배경색 결정 함수
  const getHoverBackgroundClass = (token: string) => {
    switch (token) {
      case "violet":
        return "hover:bg-violet-500/10";
      case "emerald":
        return "hover:bg-emerald-500/10";
      case "blue":
        return "hover:bg-blue-500/10";
      case "amber":
        return "hover:bg-amber-500/10";
      case "red":
        return "hover:bg-red-500/10";
      case "cyan":
        return "hover:bg-cyan-500/10";
      case "lime":
        return "hover:bg-lime-500/10";
      default:
        return "hover:bg-primary/10";
    }
  };

  // Page Selector Component
  const PageSelector = () => (
    <div className="px-3 pt-3">
      <div className="mb-2">
        <h3 className="text-xs font-medium text-muted-foreground">
          Canvas Layers
        </h3>
      </div>
      <Select
        value={selectedPageBlock?.id || undefined}
        onValueChange={onPageValueChange}
      >
        <SelectTrigger className="h-8 text-xs [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span>svg]:shrink-0">
          <SelectValue placeholder="Select page..." />
        </SelectTrigger>
        <SelectContent className="max-h-80 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]>span>svg]:shrink-0">
          {PAGE_GROUPS.map((group, groupIndex) => {
            const IconComponent = group.icon;
            const groupPages = pageOptions[group.type] || [];

            return (
              <React.Fragment key={group.type}>
                <SelectGroup>
                  <SelectLabel className="text-[12px] text-muted-foreground/80">
                    {group.label}
                  </SelectLabel>
                  {groupPages.map((page) => {
                    const colorToken = PAGE_BLOCK_COLOR_TOKENS[group.type];
                    const isActive = page.id === selectedPageBlock?.id;

                    return (
                      <SelectItem
                        key={page.id}
                        value={page.id}
                        className={`text-xs [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span>svg]:shrink-0 ${
                          isActive
                            ? getActiveBackgroundClass(colorToken)
                            : getHoverBackgroundClass(colorToken)
                        }`}
                      >
                        <IconComponent
                          className={`h-3 w-3 ${getIconColor(group.type)}`}
                        />
                        <span className="truncate">{page.name}</span>
                      </SelectItem>
                    );
                  })}
                  {groupPages.length === 0 && (
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      No {group.label.toLowerCase()} pages
                    </div>
                  )}
                </SelectGroup>
                {groupIndex < PAGE_GROUPS.length - 1 && <SelectSeparator />}
              </React.Fragment>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );

  // Layer List Component
  const LayerList = () => (
    <div className="flex-1 overflow-auto px-3">
      <h3 className="text-xs font-medium text-muted-foreground mb-3">
        Canvas Layers
      </h3>
      <div className="space-y-1">
        {filteredItems.map((item) => {
          const blockType = item.type as PageBlockType;
          const IconComponent =
            PAGE_BLOCK_ICONS[blockType] || PAGE_BLOCK_ICONS.workflow;
          const isActive = false; // TODO: Implement active block tracking

          return (
            <div
              key={item.id}
              className={`flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent transition-colors ${
                isActive ? "bg-accent" : ""
              }`}
              onClick={() => handleBlockItemClick(item.id)}
            >
              <IconComponent
                className={`h-4 w-4 ${
                  isActive ? "text-primary" : getIconColor(blockType)
                }`}
              />
              <span
                className={`flex-1 text-xs truncate ${
                  isActive ? "text-primary font-medium" : "text-foreground"
                }`}
                title={item.name}
              >
                {item.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVisibilityToggle(item.id, item.visible);
                }}
                title={item.visible ? "Hide layer" : "Show layer"}
              >
                {item.visible ? (
                  <Eye className="h-2.5 w-2.5 text-secondary/50" />
                ) : (
                  <EyeOff className="h-2.5 w-2.5 text-secondary/50" />
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Empty State Component
  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-muted-foreground text-sm">
        No blocks in current canvas
      </div>
    </div>
  );

  return (
    <div className={`flex h-full flex-col gap-3 ${className}`}>
      <PageSelector />
      <SearchAndToggle
        searchValue={searchValue}
        handleSearchChange={handleSearchChange}
        isExpanded={isExpanded}
        handleToggleExpanded={handleToggleExpanded}
      />
      <Separator />
      {hasItems ? <LayerList /> : <EmptyState />}
    </div>
  );
}
