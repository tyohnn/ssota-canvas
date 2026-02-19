'use client';

import { useState } from 'react';

import { Check, Loader2, Sparkles } from 'lucide-react';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';
import { useSourceSummaryLanguages } from '@/domains/source-management/frontend/hooks';
import { getLanguageName } from '@/domains/source-management/frontend/components/summary-tab';
import { SUPPORTED_LANGUAGES } from '@/domains/source-management/shared/value-objects/language-code.vo';

import { useExtractSummary } from '../core/use-extract-summary';

import { ExtractSummaryActionView } from './extract-summary-action.view';

export interface ExtractSummaryActionProps {
  blockType: BlockType;
  blockId: string;
  blockData: BlockNodeData;
}

export function ExtractSummaryAction({
  blockType,
  blockId,
  blockData,
}: ExtractSummaryActionProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const blockSlug = blockData?.blockId ?? blockId;

  const { extractSummary, openSummaryTab, isLoading, isSuccess } =
    useExtractSummary({
      blockType,
      blockId: blockSlug,
      blockData,
    });

  const sourceId = blockData?.sourceId;

  const { languages: availableLanguages } = useSourceSummaryLanguages({
    blockId: blockSlug,
    ...(sourceId ? { sourceId } : {}),
    enabled: !!blockSlug && !!sourceId,
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

  const languages = SUPPORTED_LANGUAGES.map((code) => ({
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
