"use client";

import React from "react";
import { useUiLayout } from "@/domains/canvas/contexts/UiLayoutContext";
import { Separator } from "@workspace/ui/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";
import { Button } from "@workspace/ui/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageExplorerTab } from "./page-explorer-tab";
import { LayerExplorerTab } from "./layer-explorer-tab";
import { AssetsExplorerTab } from "./assets-explorer-tab";

export function SideExplorer() {
  const ui = useUiLayout();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isHoverExpanded, setIsHoverExpanded] = React.useState(false);
  const [isHoverAreaVisible, setIsHoverAreaVisible] = React.useState(false);

  // 호버 타이머 관리
  const hoverTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const expandTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (!isExpanded) {
      // 호버 영역을 즉시 보이게 함
      setIsHoverAreaVisible(true);

      // 기존 타이머들 클리어
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current);
      }

      // 500ms 지연 후 익스플로러 열기
      expandTimerRef.current = setTimeout(() => {
        setIsHoverExpanded(true);
      }, 500);
    }
  };

  const handleMouseLeave = () => {
    if (!isExpanded) {
      // 호버 영역을 즉시 숨김
      setIsHoverAreaVisible(false);

      // 기존 타이머들 클리어
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current);
      }

      // 300ms 지연 후 익스플로러 닫기
      hoverTimerRef.current = setTimeout(() => {
        setIsHoverExpanded(false);
      }, 300);
    }
  };

  // 실제 표시 상태 계산
  const isActuallyExpanded = isExpanded || isHoverExpanded;

  return (
    <div className="absolute top-1/2 transform -translate-y-1/2 left-2 z-40 flex h-[calc(100%-20px)]">
      {/* Hidden Hover Area (when collapsed) */}
      {!isExpanded && (
        <div
          className={`absolute left-0 top-0 w-4 h-full z-50 transition-all duration-200 ${
            isHoverAreaVisible && !isHoverExpanded
              ? "bg-blue-500/20 border-r border-blue-500/40"
              : "bg-transparent"
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}

      {/* Main Explorer Panel */}
      <div
        className={`transition-all h-full duration-300 ease-in-out ${
          isActuallyExpanded
            ? "w-64 opacity-100 translate-x-0"
            : "w-0 opacity-0 -translate-x-4"
        }`}
        style={{
          transition:
            "opacity 200ms ease-in-out, width 300ms ease-in-out, transform 300ms ease-in-out",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="w-full h-full bg-background/70 backdrop-blur-md shadow-2xl rounded-lg flex flex-col border border-border/50">
          <Tabs
            value={ui.activeLeftTab}
            onValueChange={(value) => ui.setActiveLeftTab(value as any)}
            className="flex flex-col h-full"
          >
            <div className="px-2 pt-3 pb-1">
              <TabsList className="w-full">
                <TabsTrigger value="pages" className="flex-1 text-xs">
                  Pages
                </TabsTrigger>
                <TabsTrigger value="layers" className="flex-1 text-xs">
                  Layers
                </TabsTrigger>
                <TabsTrigger value="assets" className="flex-1 text-xs">
                  Assets
                </TabsTrigger>
              </TabsList>
            </div>

            {/* <Separator /> */}

            <div className="flex-1 relative overflow-hidden h-full">
              <TabsContent
                value="pages"
                forceMount
                className="absolute inset-0 data-[state=inactive]:opacity-0 data-[state=inactive]:translate-x-4 data-[state=inactive]:pointer-events-none data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=active]:pointer-events-auto transition-all duration-300 ease-in-out h-full m-0 pr-1 transform-gpu will-change-transform"
              >
                <PageExplorerTab />
              </TabsContent>

              <TabsContent
                value="layers"
                forceMount
                className="absolute inset-0 data-[state=inactive]:opacity-0 data-[state=inactive]:translate-x-4 data-[state=inactive]:pointer-events-none data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=active]:pointer-events-auto transition-all duration-300 ease-in-out h-full m-0 pr-1 transform-gpu will-change-transform"
              >
                <LayerExplorerTab />
              </TabsContent>

              <TabsContent
                value="assets"
                forceMount
                className="absolute inset-0 data-[state=inactive]:opacity-0 data-[state=inactive]:translate-x-4 data-[state=inactive]:pointer-events-none data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=active]:pointer-events-auto transition-all duration-300 ease-in-out h-full m-0 pr-1 transform-gpu will-change-transform"
              >
                <AssetsExplorerTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="ml-4 mt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0 rounded-md bg-background/70 backdrop-blur-md border border-border/50 shadow-xl"
              >
                {isExpanded ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{isExpanded ? "Collapse Explorer" : "Expand Explorer"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
