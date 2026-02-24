'use client';

import { Box } from '@workspace/ui/components/ui/box';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/ui/tabs';
import { InteractionGuard } from '../../common/interaction-guard';
import { useMockEditorPanel } from '../core/use-mock-editor-panel';
import type { MockEditorPanelTabId } from '../core/types';
import { MockSummarySection } from './mock-summary-section';
import { MockScriptSection } from './mock-script-section';

const TABS: { id: MockEditorPanelTabId; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'note', label: 'Note' },
  { id: 'metadata', label: 'Metadata' },
];

interface MockEditorPanelTabsProps {
  currentStepIndex: number;
}

/**
 * Editor panel tabs with InteractionGuards for tutorial steps (timeline-tab, summary-tab).
 */
export function MockEditorPanelTabs({
  currentStepIndex,
}: MockEditorPanelTabsProps) {
  const { activeTab, setActiveTab } = useMockEditorPanel();

  return (
    <Box className="my-4 relative flex-1 min-h-0 flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as MockEditorPanelTabId)}
      >
        <Box className="sticky top-0 z-50 bg-background px-4 py-2 shrink-0">
          <TabsList className="justify-start">
            {TABS.map((tab) => {
              const Trigger = (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              );
              const guardSelector =
                tab.id === 'timeline'
                  ? 'timeline-tab'
                  : tab.id === 'summary'
                    ? 'summary-tab'
                    : tab.id === 'note'
                      ? 'note-tab'
                      : 'metadata-tab';
              return (
                <InteractionGuard key={tab.id} selector={guardSelector}>
                  {Trigger}
                </InteractionGuard>
              );
            })}
          </TabsList>
        </Box>

        <Box className="px-0 flex-1 min-h-0 overflow-auto">
          <TabsContent value="summary" className="mt-0 h-full">
            <MockSummarySection currentStepIndex={currentStepIndex} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-0 h-full">
            <MockScriptSection />
          </TabsContent>
          <TabsContent value="note" className="mt-0">
            <Box className="p-4 text-sm text-muted-foreground">
              Note tab — take notes about this block.
            </Box>
          </TabsContent>
          <TabsContent value="metadata" className="mt-0">
            <Box className="p-4 text-sm text-muted-foreground">
              Metadata — video info, channel, etc.
            </Box>
          </TabsContent>
        </Box>
      </Tabs>
    </Box>
  );
}
