'use client';

import { useState } from 'react';

import { Check, Loader2, Sparkles } from 'lucide-react';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import { SUPPORTED_LANGUAGES } from '@/domains/youtube-app-space/shared/value-objects/language-code.vo';
import { useAvailableSummaryLanguages } from '@/domains/youtube-app-space/frontend/hooks';

import { useExtractSummary } from './use-extract-summary';
import { ExtractSummaryActionView } from './extract-summary-action.view';

interface ExtractSummaryActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

/**
 * 언어 코드를 언어 이름으로 변환
 */
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

  // blockData에서 youtubeId 추출
  const youtubeId = (() => {
    try {
      const properties = blockData?.properties as
        | YoutubeBlockProperties
        | undefined;
      if (properties) {
        const youtubeProperties = YoutubeBlockPropertiesVO.fromJSON(properties);
        return youtubeProperties.youtubeId;
      }
    } catch (error) {
      console.warn(
        '[ExtractSummaryAction] Failed to parse YouTube properties:',
        error
      );
    }
    return undefined;
  })();

  // 이미 추출된 언어 목록 조회
  const { languages: availableLanguages } = useAvailableSummaryLanguages({
    blockId,
    youtubeId: youtubeId || '',
    readonly: false,
  });

  const handleLanguageSelect = (language: string) => {
    setIsPopoverOpen(false);

    // 이미 추출된 언어는 API 호출 없이 바로 탭 열기
    if (availableLanguages.includes(language)) {
      openSummaryTab(language);
    } else {
      // 아직 추출되지 않은 언어는 API 호출 후 탭 열기
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
      disabled={isLoading}
      languages={languages}
      availableLanguages={availableLanguages}
      onLanguageSelect={handleLanguageSelect}
    />
  );
}
