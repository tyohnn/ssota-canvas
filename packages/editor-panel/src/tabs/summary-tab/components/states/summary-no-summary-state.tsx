'use client';

import { Info } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';
import { ExtractSummaryButton } from '../extract-summary-button';

export interface SummaryNoSummaryStateProps {
  language: string;
  onExtractSummary: (language: string) => Promise<void>;
  isExtracting?: boolean;
  readonly?: boolean;
  getLanguageName?: (code: string) => string;
}

export function SummaryNoSummaryState({
  language,
  onExtractSummary,
  isExtracting = false,
  readonly = false,
  getLanguageName,
}: SummaryNoSummaryStateProps) {
  return (
    <>
      <Box className="bg-muted border border-border rounded-lg px-4 py-3 mb-4">
        <p className="text-center text-sm text-foreground whitespace-pre-line">
          <Info aria-hidden className="-mt-0.5 me-3 inline-flex opacity-60" size={16} />
          {readonly
            ? `No summary available for this language.\nTo extract a summary, please duplicate this page.`
            : `No summary available for this language.\nExtract summary to view the summary.`}
        </p>
      </Box>
      <ExtractSummaryButton
        language={language}
        onExtractSummary={() => onExtractSummary(language)}
        isLoading={isExtracting}
        disabled={readonly}
        getLanguageName={getLanguageName}
      />
    </>
  );
}
