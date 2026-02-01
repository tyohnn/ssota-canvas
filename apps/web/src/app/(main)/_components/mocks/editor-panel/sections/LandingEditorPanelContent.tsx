/**
 * Landing Editor Panel Content Area
 * 
 * Replicated from Content Area
 * 공통 컴포넌트 - summarize와 structure 탭 모두에서 사용
 */

'use client';

import { Box } from '@/components/ui/box';
import { LandingTitleInput } from './LandingTitleInput';
import { LandingBlockPropertiesSection } from './LandingBlockPropertiesSection';
import { LandingBlockContentTabsSection } from './LandingBlockContentTabsSection';

interface LandingEditorPanelContentProps {
  step: number;
}

export function LandingEditorPanelContent({ step }: LandingEditorPanelContentProps) {
  return (
    <Box
      className="flex-1 min-h-0 overflow-y-auto"
      data-content-area-scroll-container="true"
    >
      {/* Title Section */}
      <LandingTitleInput />

      {/* Block Properties (Schema-based) */}
      <LandingBlockPropertiesSection />

      {/* Block Content Tabs Section */}
      <LandingBlockContentTabsSection step={step} />
    </Box>
  );
}
