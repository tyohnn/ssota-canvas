'use client';

import { Compass, Edit3, Users } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@workspace/ui/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/components/ui/tabs';
import { useImageSpaceContext } from '../core/image-space.context';
import type { TopMenu } from '../core/types';

/**
 * Image Space Header
 *
 * 상단 메뉴 탭 (탐색 | 에디터 | 커뮤니티)
 */
export function ImageSpaceHeader() {
  const { activeTopMenu, setActiveTopMenu } = useImageSpaceContext();

  const tabs: { id: TopMenu; label: string; icon: React.ReactNode }[] = [
    { id: 'explore', label: 'Explore', icon: <Compass className="h-4 w-4" /> },
    { id: 'editor', label: 'Editor', icon: <Edit3 className="h-4 w-4" /> },
    {
      id: 'community',
      label: 'Community',
      icon: <Users className="h-4 w-4" />,
    },
  ];

  return (
    <div className="pt-2 bg-background border-b">
      <Tabs
        value={activeTopMenu}
        onValueChange={value => setActiveTopMenu(value as TopMenu)}
      >
        <ScrollArea className="px-4">
          <TabsList className="h-auto gap-2 rounded-none bg-transparent px-0 pb-0 text-foreground">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
              >
                <span className="-ms-0.5 me-1.5 opacity-60">{tab.icon}</span>
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
