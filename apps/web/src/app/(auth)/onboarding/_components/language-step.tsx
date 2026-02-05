'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import { Label } from '@workspace/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/ui/card';
import { SUPPORTED_LANGUAGES } from '@/domains/youtube-app-space/shared/value-objects/language-code.vo';
import { OnboardingCanvas } from './onboarding-canvas';

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

const GREETINGS: Record<string, string> = {
  en: "Hello, I'm ssota.",
  ko: '안녕하세요, 저는 쏘타에요.',
  ja: 'こんにちは、私はソタです。',
  zh: '你好. 我是ssota。',
  es: 'Hola, soy ssota.',
  fr: 'Bonjour, je suis ssota.',
  de: 'Hallo, ich bin ssota.',
  pt: 'Olá, eu sou ssota.',
  ru: 'Привет, я ssota.',
  ar: 'مرحبا، أنا ssota.',
};

type LanguageStepProps = {
  initialLanguage: string;
  onComplete: (language: string) => void;
};

export function LanguageStep({ initialLanguage, onComplete }: LanguageStepProps) {
  const [language, setLanguage] = useState(initialLanguage);

  // Save to localStorage immediately on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ssota_language', language);
    }
  }, [language]);

  const handleContinue = () => {
    onComplete(language);
  };

  return (
    <>
      {/* Left Panel - Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10 w-full lg:w-1/3">
        <div className="flex justify-center gap-2 md:justify-start">
          <span className="font-medium">ssota</span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Choose Your Language</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="language">Preferred Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map(code => (
                        <SelectItem key={code} value={code}>
                          {LANGUAGE_NAMES[code] || code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleContinue} className="w-full">
                  Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Right Panel - Canvas */}
      <div className="hidden lg:block lg:w-2/3 bg-muted relative min-h-0">
        <div className="absolute inset-0">
          <OnboardingCanvas
            step="language"
            language={language}
            greeting={GREETINGS[language] || GREETINGS.en}
          />
        </div>
      </div>
    </>
  );
}
