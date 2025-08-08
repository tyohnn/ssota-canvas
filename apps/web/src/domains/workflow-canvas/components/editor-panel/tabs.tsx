"use client";

import React from "react";
import { EditorTab } from "./context";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs";
import { Settings, Palette, GitBranch, Database } from "lucide-react";
import { ConfigurationTab } from "./tabs/configuration-tab";
import { DesignTab } from "./tabs/design-tab";
import { MetadataTab } from "./tabs/metadata-tab";
import { RelationTab } from "./tabs/relation-tab";

interface EditorPanelTabsProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
}

export function EditorPanelTabs({
  activeTab,
  onTabChange,
}: EditorPanelTabsProps) {
  const tabs = [
    {
      id: "configuration",
      label: "Configuration",
      icon: Settings,
    },
    {
      id: "design",
      label: "Design",
      icon: Palette,
    },
    {
      id: "metadata",
      label: "Metadata",
      icon: Database,
    },
    {
      id: "relation",
      label: "Relation",
      icon: GitBranch,
    },
  ];

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as EditorTab)}
      className="flex flex-col h-full"
    >
      <div className="">
        <TabsList className="bg-background h-auto p-0 shadow-xs grid grid-cols-4 gap-0">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-primary/10 data-[state=active]:after:bg-primary relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e px-2 text-xs"
              >
                <IconComponent
                  className="me-1 opacity-60"
                  size={14}
                  aria-hidden="true"
                />
                <span className="whitespace-nowrap">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {/* 탭 컨텐츠 - forceMount로 상태 유지 */}
      <div className="flex-1 relative overflow-hidden">
        {/* Configuration Tab */}
        <TabsContent
          value="configuration"
          forceMount
          className="absolute inset-0 data-[state=inactive]:opacity-0 data-[state=inactive]:translate-x-4 data-[state=inactive]:pointer-events-none data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=active]:pointer-events-auto transition-all duration-300 ease-in-out h-full m-0 p-4 overflow-y-auto pb-8 transform-gpu will-change-transform"
        >
          <ConfigurationTab />
        </TabsContent>

        {/* Design Tab */}
        <TabsContent
          value="design"
          forceMount
          className="absolute inset-0 data-[state=inactive]:opacity-0 data-[state=inactive]:translate-x-4 data-[state=inactive]:pointer-events-none data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=active]:pointer-events-auto transition-all duration-300 ease-in-out h-full m-0 p-4 overflow-y-auto pb-8 transform-gpu will-change-transform"
        >
          <DesignTab />
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent
          value="metadata"
          forceMount
          className="absolute inset-0 data-[state=inactive]:opacity-0 data-[state=inactive]:translate-x-4 data-[state=inactive]:pointer-events-none data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=active]:pointer-events-auto transition-all duration-300 ease-in-out h-full m-0 p-4 overflow-y-auto pb-8 transform-gpu will-change-transform"
        >
          <MetadataTab />
        </TabsContent>

        {/* Relation Tab */}
        <TabsContent
          value="relation"
          forceMount
          className="absolute inset-0 data-[state=inactive]:opacity-0 data-[state=inactive]:translate-x-4 data-[state=inactive]:pointer-events-none data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=active]:pointer-events-auto transition-all duration-300 ease-in-out h-full m-0 p-4 overflow-y-auto pb-8 transform-gpu will-change-transform"
        >
          <RelationTab />
        </TabsContent>
      </div>
    </Tabs>
  );
}
