/**
 * Summary No Summary State
 *
 * 요약이 없을 때 표시하는 컴포넌트
 */

'use client';

import { Info } from 'lucide-react';

import { Box } from '@/components/ui/box';

import { ExtractSummaryButton } from './extract-summary-button';

/**
 * Summary No Summary State Props
 */
interface SummaryNoSummaryStateProps {
  language: string;
  onExtractSummary: (language: string) => Promise<void>;
  isExtracting?: boolean;
}

/**
 * Summary No Summary State Component
 */
export function SummaryNoSummaryState({
  language,
  onExtractSummary,
  isExtracting = false,
}: SummaryNoSummaryStateProps) {
  return (
    <>
      <Box className="bg-muted border border-border rounded-lg px-4 py-3 mb-4">
        <p className="text-center text-sm text-foreground">
          <Info
            aria-hidden="true"
            className="-mt-0.5 me-3 inline-flex opacity-60"
            size={16}
          />
          No summary available for this language. Extract summary from YouTube video to view the
          summary.
        </p>
      </Box>
      <ExtractSummaryButton
        language={language}
        onExtractSummary={() => onExtractSummary(language)}
        isLoading={isExtracting}
      />
    </>
  );
}
