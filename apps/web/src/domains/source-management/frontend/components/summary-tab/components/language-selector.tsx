/**
 * Language Selector
 *
 * 언어 선택 드롭다운 컴포넌트
 */

'use client';

import { Check, Globe } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/ui/select';

import { SUPPORTED_LANGUAGES } from '@/domains/source-management/shared/value-objects/language-code.vo';
import { Box } from '@/components/ui/box';

interface LanguageSelectorProps {
  availableLanguages: string[];
  selectedLanguage: string;
  onChange: (language: string) => void;
}

export function getLanguageName(code: string): string {
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

export function LanguageSelector({
  availableLanguages,
  selectedLanguage,
  onChange,
}: LanguageSelectorProps) {
  return (
    <Box className="mb-8 flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedLanguage} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map(lang => {
            const isAvailable = availableLanguages.includes(lang);
            return (
              <SelectItem key={lang} value={lang}>
                <Box className="flex items-center justify-between w-full">
                  <span>{getLanguageName(lang)}</span>
                  {isAvailable && (
                    <Check className="ml-2 h-3 w-3 text-green-600" />
                  )}
                </Box>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </Box>
  );
}
