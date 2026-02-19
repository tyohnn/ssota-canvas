/**
 * Mock Youtube Action Bar
 *
 * Replicated from Block Action Bar using View components
 * Renders at bottom of block (bottom-[-50px])
 */

'use client';

import React, { useRef } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { ToolbarContainer } from '@workspace/ui/components/ssota-ui/toolbar-container';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { Box } from '@/components/ui/box';
import { cn } from '@workspace/ui/lib/utils';
import { ExtractSummaryActionView } from '@/domains/source-management/frontend/components/extract-summary-action';
import { SUPPORTED_LANGUAGES } from '@/domains/youtube-app-space/shared/value-objects/language-code.vo';

interface MockYoutubeActionBarProps {
  step: number;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  zh: '中文',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ru: 'Русский',
  ar: 'العربية',
};

const LANGUAGES = SUPPORTED_LANGUAGES.map(code => ({
  code,
  label: LANGUAGE_LABELS[code] ?? code.toUpperCase(),
}));

export function MockYoutubeActionBar({ step }: MockYoutubeActionBarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // step 1: toolbar click - show popover (closes when panel opens at step 2)
  const showSummarizePopover = step === 1;
  const isSummarizeHighlighted = step >= 1;

  const icon = isSummarizeHighlighted ? (
    <Check className="text-green-600" />
  ) : (
    <Sparkles />
  );

  return (
    <Box
      className={cn(
        'absolute bottom-[-50px] left-1/2 -translate-x-1/2 z-50',
        'pointer-events-auto'
      )}
    >
      <ToolbarContainer
        toolbarRef={toolbarRef}
        preventDrag
        preventMouseDown
        preventClick
        className="gap-0.5"
      >
        <TooltipProvider>
          <ExtractSummaryActionView
            isPopoverOpen={showSummarizePopover}
            onPopoverOpenChange={() => {}}
            icon={icon}
            tooltip="Extract Summary"
            disabled={false}
            languages={LANGUAGES}
            availableLanguages={['en']}
            onLanguageSelect={() => {}}
          />
        </TooltipProvider>
      </ToolbarContainer>
    </Box>
  );
}
