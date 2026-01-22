/**
 * Summary Error State
 *
 * 요약 로드 중 에러가 발생했을 때 표시하는 컴포넌트
 */

'use client';

import { AlertCircle, Info } from 'lucide-react';

import { Box } from '@/components/ui/box';

import { ExtractSummaryButton } from './extract-summary-button';

/**
 * Summary Error State Props
 */
interface SummaryErrorStateProps {
  error: string;
  hasSummary: boolean;
  language: string;
  onExtractSummary: (language: string) => Promise<void>;
  isExtracting?: boolean;
  readonly?: boolean;
}

/**
 * Summary Error State Component
 */
export function SummaryErrorState({
  error,
  hasSummary,
  language,
  onExtractSummary,
  isExtracting = false,
  readonly = false,
}: SummaryErrorStateProps) {
  return (
    <>
      <Box className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-4">
        <p className="text-center text-sm text-destructive whitespace-pre-line">
          <AlertCircle
            aria-hidden="true"
            className="-mt-0.5 me-3 inline-flex"
            size={16}
          />
          {error}
        </p>
      </Box>
      {!hasSummary && readonly && (
        <Box className="bg-muted border border-border rounded-lg px-4 py-3 mb-4">
          <p className="text-center text-sm text-foreground whitespace-pre-line">
            <Info
              aria-hidden="true"
              className="-mt-0.5 me-3 inline-flex opacity-60"
              size={16}
            />
            {`To extract a summary, please duplicate this page.`}
          </p>
        </Box>
      )}
      {!hasSummary && (
        <ExtractSummaryButton
          language={language}
          onExtractSummary={() => onExtractSummary(language)}
          isLoading={isExtracting}
          disabled={readonly}
        />
      )}
    </>
  );
}
