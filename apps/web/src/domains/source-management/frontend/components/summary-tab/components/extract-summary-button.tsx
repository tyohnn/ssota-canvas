/**
 * Extract Summary Button
 *
 * 요약 추출 버튼 컴포넌트
 */

'use client';

import { Button } from '@workspace/ui/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

import { getLanguageName } from './language-selector';

interface ExtractSummaryButtonProps {
  language: string;
  onExtractSummary: () => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ExtractSummaryButton({
  language,
  onExtractSummary,
  isLoading = false,
  disabled = false,
}: ExtractSummaryButtonProps) {
  const isDisabled = isLoading || disabled;

  return (
    <Button
      onClick={onExtractSummary}
      disabled={isDisabled}
      className={`w-full ${isDisabled ? 'cursor-not-allowed' : ''}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Extracting Summary ({getLanguageName(language)})...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Extract Summary ({getLanguageName(language)})
        </>
      )}
    </Button>
  );
}
