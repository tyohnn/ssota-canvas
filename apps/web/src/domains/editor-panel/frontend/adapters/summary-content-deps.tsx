'use client';

import { useMemo } from 'react';
import { TipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor';
import { convertMarkdownToTiptapJSON } from '@/domains/ai-management/frontend/utils/markdown-to-tiptap';
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@/domains/source-management/shared/value-objects/language-code.vo';
import type { SummaryContentDeps } from '@workspace/editor-panel';

const LANGUAGE_NAMES: Record<string, string> = {
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

export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

export function orderLanguagesWithPreferenceFirst(
  userPreferredLanguage: string | undefined
): string[] {
  if (!userPreferredLanguage) return [...SUPPORTED_LANGUAGES];
  const pref = userPreferredLanguage.toLowerCase();
  if (!SUPPORTED_LANGUAGES.includes(pref as SupportedLanguage)) return [...SUPPORTED_LANGUAGES];
  const rest = SUPPORTED_LANGUAGES.filter((l) => l !== pref);
  return [pref as SupportedLanguage, ...rest];
}

export function useSummaryContentDeps(): SummaryContentDeps {
  return useMemo(
    () => ({
      TipTapEditorComponent: TipTapEditor,
      convertMarkdownToTiptapJSON: (md: string) =>
        convertMarkdownToTiptapJSON(md) as import('@tiptap/core').JSONContent,
    }),
    []
  );
}
