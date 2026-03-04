'use client';

import { Button } from '@workspace/ui/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

export interface ExtractSummaryButtonProps {
  language: string;
  onExtractSummary: () => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  getLanguageName?: (code: string) => string;
}

export function ExtractSummaryButton({
  language,
  onExtractSummary,
  isLoading = false,
  disabled = false,
  getLanguageName = (code) => code.toUpperCase(),
}: ExtractSummaryButtonProps) {
  const isDisabled = isLoading || disabled;
  const label = getLanguageName(language);

  return (
    <Button onClick={onExtractSummary} disabled={isDisabled} className={isDisabled ? 'cursor-not-allowed' : ''}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Extracting Summary ({label})...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Extract Summary ({label})
        </>
      )}
    </Button>
  );
}
