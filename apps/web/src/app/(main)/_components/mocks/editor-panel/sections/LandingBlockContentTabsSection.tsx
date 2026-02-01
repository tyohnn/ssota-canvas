/**
 * Landing Block Content Tabs Section
 * 
 * Replicated from Block Content Tabs Section
 * 공통 컴포넌트 - summarize와 structure 탭 모두에서 사용
 */

'use client';

import React, { useState } from 'react';
import { Box } from '@/components/ui/box';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { SummaryTableOfContents } from '@/domains/block-management/frontend/components/block/block-type/youtube/components/section-tabs/summary-section/components/summary-table-of-contents';
import { SummaryTOCSlotProvider, useSummaryTOCSlot } from '@/domains/block-management/frontend/components/block/block-type/youtube/components/section-tabs/summary-section/components/summary-toc-slot-context';
import { LANDING_YOUTUBE_PROPERTIES } from '../../landing-youtube-mock-data';
import { LandingMetadataSection } from '../common-tabs/LandingMetadataSection';
import { LandingSummarySection } from '../youtube-tabs/LandingSummarySection';
import { LandingScriptSection } from '../youtube-tabs/LandingScriptSection';
import { LandingNoteSection } from '../common-tabs/LandingNoteSection';

/** TOC를 탭 헤더와 형제로 렌더 (z-index 이슈 해결) */
function TOCOverlay() {
  const slot = useSummaryTOCSlot();
  if (!slot?.tiptapContent || !slot.showTOC) return null;
  return (
    <div className="absolute inset-0 z-100 pointer-events-none *:pointer-events-auto">
      <SummaryTableOfContents
        tiptapContent={slot.tiptapContent}
        showTOC={slot.showTOC}
      />
    </div>
  );
}

interface LandingBlockContentTabsSectionProps {
  step: number;
}

export function LandingBlockContentTabsSection({ step }: LandingBlockContentTabsSectionProps) {
  const [selectedTabId, setSelectedTabId] = useState('summary');

  // Mock Tabs Config
  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'script', label: 'Script' },
    { id: 'note', label: 'Note' },
    { id: 'metadata', label: 'Metadata' },
  ];

  // Mock Metadata - from shared landing YouTube data
  const mockMetadata = {
    youtubeTitle: LANDING_YOUTUBE_PROPERTIES.youtubeTitle,
    youtubeDescription: LANDING_YOUTUBE_PROPERTIES.youtubeDescription,
    viewCount: LANDING_YOUTUBE_PROPERTIES.viewCount,
    likeCount: LANDING_YOUTUBE_PROPERTIES.likeCount,
    channelName: LANDING_YOUTUBE_PROPERTIES.channelName,
    youtubeChannelId: LANDING_YOUTUBE_PROPERTIES.youtubeChannelId,
    channelThumbnail: LANDING_YOUTUBE_PROPERTIES.channelThumbnail,
    commentCount: LANDING_YOUTUBE_PROPERTIES.commentCount,
    publishedAt: LANDING_YOUTUBE_PROPERTIES.publishedAt,
  };

  return (
    <SummaryTOCSlotProvider>
      <Box className="my-4 relative">
        <Tabs
          value={selectedTabId}
          onValueChange={setSelectedTabId}
        >
          {/* Tab Header - sticky */}
          <Box className="sticky top-0 z-50 bg-background px-6 py-2 ">
            <TabsList className="justify-start">
              {tabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Box>

          {/* TOC - 탭 헤더와 형제로 렌더, stacking으로 위에 표시 */}
          <TOCOverlay />

          {/* Tab Content */}
          <Box className="px-0">
            <TabsContent value="summary">
              <LandingSummarySection step={step} />
            </TabsContent>

            <TabsContent value="script">
              <LandingScriptSection />
            </TabsContent>

            <TabsContent value="note">
              <LandingNoteSection />
            </TabsContent>

            <TabsContent value="metadata">
              <LandingMetadataSection metadata={mockMetadata} />
            </TabsContent>
          </Box>
        </Tabs>
      </Box>
    </SummaryTOCSlotProvider>
  );
}
