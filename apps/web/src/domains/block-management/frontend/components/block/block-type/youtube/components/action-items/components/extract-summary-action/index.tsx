'use client';

import { useState } from 'react';

import { Check, Loader2, Sparkles } from 'lucide-react';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useSourceSummaryLanguages } from '@/domains/source-management/frontend/hooks';
import { SUPPORTED_LANGUAGES } from '@/domains/youtube-app-space/shared/value-objects/language-code.vo';

import { useExtractSummary } from './use-extract-summary';
import { ExtractSummaryActionView } from './extract-summary-action.view';

interface ExtractSummaryActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

function getLanguageName(code: string): string {
  const languageNames: Record<string, string> = {
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
  return languageNames[code] || code.toUpperCase();
}

export function ExtractSummaryAction({
  blockId,
  blockData,
}: ExtractSummaryActionProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { extractSummary, openSummaryTab, isLoading, isSuccess } =
    useExtractSummary({
      blockId,
      blockData,
    });

  const sourceId = blockData?.sourceId;

  const { languages: availableLanguages } = useSourceSummaryLanguages({
    blockId,
    ...(sourceId ? { sourceId } : {}),
    enabled: !!blockId && !!sourceId,
  });

  const handleLanguageSelect = (language: string) => {
    setIsPopoverOpen(false);
    if (availableLanguages.includes(language)) {
      openSummaryTab(language);
    } else {
      extractSummary(language);
    }
  };

  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="animate-spin" />;
    }
    if (isSuccess) {
      return <Check className="text-green-600" />;
    }
    return <Sparkles />;
  };

  const languages = SUPPORTED_LANGUAGES.map(code => ({
    code,
    label: getLanguageName(code),
  }));

  return (
    <ExtractSummaryActionView
      isPopoverOpen={isPopoverOpen}
      onPopoverOpenChange={setIsPopoverOpen}
      icon={getIcon()}
      tooltip={isSuccess ? 'Summary Extracted!' : 'Extract Summary'}
      disabled={isLoading || !sourceId}
      languages={languages}
      availableLanguages={availableLanguages}
      onLanguageSelect={handleLanguageSelect}
    />
  );
}
