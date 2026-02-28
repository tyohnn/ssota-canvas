'use client';

import { useState } from 'react';

import { Check, Loader2, Sparkles } from 'lucide-react';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useSourceSummaryLanguages } from '@/domains/source-management/frontend/hooks';
import { getLanguageName } from '@/domains/source-management/frontend/components/summary-tab';
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@/domains/source-management/shared/value-objects/language-code.vo';
import { useMyProfile } from '@/domains/user-management/frontend/hooks/use-my-profile';

import { useExtractSummary } from '../core/use-extract-summary';
import { ExtractSummaryActionView } from './extract-summary-action.view';

function orderLanguagesWithPreferenceFirst(
  userPreferred: string | undefined
): SupportedLanguage[] {
  if (!userPreferred) return [...SUPPORTED_LANGUAGES];
  const pref = userPreferred.toLowerCase();
  if (!SUPPORTED_LANGUAGES.includes(pref as SupportedLanguage))
    return [...SUPPORTED_LANGUAGES];
  return [pref as SupportedLanguage, ...SUPPORTED_LANGUAGES.filter((l) => l !== pref)];
}

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
  const { workspaceId } = useCanvasMetadata();

  const { languages: availableLanguages } = useSourceSummaryLanguages({
    blockId: blockSlug,
    workspaceId,
    sourceId,
  });

  const { data: profile } = useMyProfile();
  const userPreferredLanguage = (() => {
    const raw = profile?.language?.toLowerCase().trim();
    if (raw) {
      const base = raw.slice(0, 2);
      if (SUPPORTED_LANGUAGES.includes(base as SupportedLanguage)) return base;
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      const nav = navigator.language.toLowerCase().slice(0, 2);
      if (SUPPORTED_LANGUAGES.includes(nav as SupportedLanguage)) return nav;
    }
    return undefined;
  })();
  const orderedCodes = orderLanguagesWithPreferenceFirst(userPreferredLanguage);
  const languages = orderedCodes.map((code) => ({
    code,
    label: getLanguageName(code),
  }));

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
