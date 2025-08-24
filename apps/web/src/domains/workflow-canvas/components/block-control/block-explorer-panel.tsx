"use client";

import React from "react";
import { PageBlockExplorer } from "./page-block-explorer";
import { BlockLayerExplorer } from "./block-layer-explorer";
import { Separator } from "@workspace/ui/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/ui/tabs";
import { useCanvas } from "@/domains/workflow-canvas/contexts/CanvasContext";
import { ActiveLeftTab } from "@/domains/workflow-canvas/hooks/state/useCanvasUIState";

interface BlockExplorerPanelProps {
  className?: string;
}

export function BlockExplorerPanel({ className }: BlockExplorerPanelProps) {
  // Context에서 필요한 상태와 이벤트 핸들러 가져오기
  const { activeLeftTab, setActiveLeftTab } = useCanvas();

  return (
    <div className={`bg-background flex flex-col h-full ${className}`}>
      {/* shadcn Tabs with forceMount */}
      <Tabs
        value={activeLeftTab}
        onValueChange={(value) => setActiveLeftTab(value as ActiveLeftTab)}
        className="flex flex-col h-full"
      >
        <div className="px-3 pt-3 pb-1">
          <TabsList className="w-full">
            <TabsTrigger value="pages" className="flex-1 text-xs">
              Pages
            </TabsTrigger>
            <TabsTrigger value="layers" className="flex-1 text-xs">
              Layers
            </TabsTrigger>
          </TabsList>
        </div>

        <Separator />

        {/* 탭 컨텐츠 - forceMount로 상태 유지 */}
        <div className="flex-1 relative overflow-hidden">
          {/* Pages Tab - forceMount로 항상 렌더링 */}
          <TabsContent
            value="pages"
            forceMount
            className="absolute inset-0 data-[state=inactive]:opacity-0 data-[state=inactive]:translate-x-4 data-[state=inactive]:pointer-events-none data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=active]:pointer-events-auto transition-all duration-300 ease-in-out h-full m-0 transform-gpu will-change-transform"
          >
            <PageBlockExplorer />
          </TabsContent>

          {/* Layers Tab - forceMount로 항상 렌더링 */}
          <TabsContent
            value="layers"
            forceMount
            className="absolute inset-0 data-[state=inactive]:opacity-0 data-[state=inactive]:translate-x-4 data-[state=inactive]:pointer-events-none data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=active]:pointer-events-auto transition-all duration-300 ease-in-out h-full m-0 pr-1 transform-gpu will-change-transform"
          >
            <BlockLayerExplorer />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
