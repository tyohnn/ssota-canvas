'use client';

import { Check, Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/ui/select';
import { Box } from '@workspace/ui/components/ui/box';

export interface LanguageSelectorProps {
  availableLanguages: string[];
  selectedLanguage: string;
  onChange: (language: string) => void;
  userPreferredLanguage?: string;
  /** Ordered list of all languages for display (preferred first) */
  orderedLanguages: string[];
  getLanguageName: (code: string) => string;
}

export function LanguageSelector({
  availableLanguages,
  selectedLanguage,
  onChange,
  orderedLanguages,
  getLanguageName,
}: LanguageSelectorProps) {
  return (
    <Box className="mb-8 flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedLanguage} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {orderedLanguages.map((lang) => {
            const isAvailable = availableLanguages.includes(lang);
            return (
              <SelectItem key={lang} value={lang}>
                <Box className="flex items-center justify-between w-full">
                  <span>{getLanguageName(lang)}</span>
                  {isAvailable && <Check className="ml-2 h-3 w-3 text-green-600" />}
                </Box>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </Box>
  );
}
