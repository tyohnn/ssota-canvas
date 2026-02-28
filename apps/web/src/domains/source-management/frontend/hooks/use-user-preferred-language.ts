'use client';

import { useMemo } from 'react';

import { useMyProfile } from '@/domains/user-management/frontend/hooks/use-my-profile';
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@/domains/source-management/shared/value-objects/language-code.vo';

/**
 * User preferred language from profile.language (single source of truth).
 * Same logic as use-source-summary-section; use for Drive add, Extract, etc.
 */
export function useUserPreferredLanguage(): string | undefined {
  const { data: profile } = useMyProfile();
  return useMemo(() => {
    const raw = profile?.language?.toLowerCase().trim();
    if (raw) {
      if (LanguageCode.isSupported(raw)) return raw;
      const base = raw.slice(0, 2);
      if (SUPPORTED_LANGUAGES.includes(base as SupportedLanguage)) return base;
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      const nav = navigator.language.toLowerCase().slice(0, 2);
      if (SUPPORTED_LANGUAGES.includes(nav as SupportedLanguage)) return nav;
    }
    return undefined;
  }, [profile?.language]);
}
