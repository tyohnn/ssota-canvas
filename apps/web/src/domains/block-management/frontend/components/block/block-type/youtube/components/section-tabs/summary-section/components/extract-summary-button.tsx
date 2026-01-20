/**
 * Extract Summary Button
 *
 * 요약 추출 버튼 컴포넌트
 */

'use client';

import { Button } from '@workspace/ui/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

/**
 * Extract Summary Button Props
 */
interface ExtractSummaryButtonProps {
  language: string;
  onExtractSummary: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Extract Summary Button Component
 */
export function ExtractSummaryButton({
  language,
  onExtractSummary,
  isLoading = false,
}: ExtractSummaryButtonProps) {
  const getLanguageName = (code: string): string => {
    const names: Record<string, string> = {
      en: 'English',
      ko: 'Korean',
      ja: 'Japanese',
      zh: 'Chinese',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      pt: 'Portuguese',
      ru: 'Russian',
      ar: 'Arabic',
    };
    return names[code] || code.toUpperCase();
  };

  return (
    <Button
      onClick={onExtractSummary}
      disabled={isLoading}
      className="w-full"
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
