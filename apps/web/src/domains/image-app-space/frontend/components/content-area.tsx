'use client';

import { ScrollArea, ScrollBar } from '@workspace/ui/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/components/ui/tabs';
import { useImageSpaceContext } from '../core/image-space.context';
import { ImageSpaceSidebar } from './sidebar';
import { ImageSpaceSearchBar } from './search-bar';
import { UnsplashTab } from './tabs/unsplash-tab';
import { SsotaTab } from './tabs/ssota-tab';
// import { AiPromptTab } from './tabs/ai-prompt-tab';
import { WorkspaceLibraryTab } from './tabs/workspace-library-tab';
import { CommunityTab } from './tabs/community-tab';
import type { ExploreTab } from '../core/types';

/**
 * Explore Tab Menu
 */
export function ExploreTabMenu() {
  const { activeExploreTab, setActiveExploreTab } = useImageSpaceContext();

  const tabs: { id: ExploreTab; label: string }[] = [
    { id: 'unsplash', label: 'Unsplash' },
    { id: 'ssota', label: 'SSOTA Image' },
    { id: 'ai-prompt', label: 'AI Prompt' },
    { id: 'workspace', label: 'Workspace Library' },
  ];

  return (
    <div className="px-4 py-2 border-b bg-muted/10">
      <Tabs
        value={activeExploreTab}
        onValueChange={value => setActiveExploreTab(value as ExploreTab)}
      >
        <ScrollArea>
          <TabsList className="gap-1 bg-transparent">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Tabs>
    </div>
  );
}

/**
 * Editor View (임시)
 */
function EditorView() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <p className="text-lg font-medium mb-2">Image Editor</p>
        <p className="text-sm">Coming soon...</p>
      </div>
    </div>
  );
}

/**
 * Explore Tab Content
 */
function ExploreTabContent() {
  const { activeExploreTab } = useImageSpaceContext();

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {activeExploreTab === 'ssota' && <SsotaTab />}
      {activeExploreTab === 'workspace' && <WorkspaceLibraryTab />}
      {activeExploreTab === 'unsplash' && <UnsplashTab />}
      {/* {activeExploreTab === 'ai-prompt' && <AiPromptTab />} */}
    </div>
  );
}

/**
 * Explore View
 *
 * 탐색 모드 (Sidebar + Search + Content)
 */
function ExploreView() {
  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      {/* 좌측 사이드바 */}
      <ImageSpaceSidebar />

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* 검색창 */}
        <ImageSpaceSearchBar />

        {/* 탭 컨텐츠 */}
        <ExploreTabContent />
      </div>
    </div>
  );
}

/**
 * Image Space Content Area
 *
 * 메인 컨텐츠 영역 (Top Menu에 따라 다른 View 표시)
 */
export function ImageSpaceContentArea() {
  const { activeTopMenu } = useImageSpaceContext();

  return (
    <>
      {activeTopMenu === 'explore' && <ExploreView />}
      {activeTopMenu === 'editor' && <EditorView />}
      {activeTopMenu === 'community' && <CommunityTab />}
    </>
  );
}
