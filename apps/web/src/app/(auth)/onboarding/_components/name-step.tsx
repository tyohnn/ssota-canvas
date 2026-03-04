'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import { Label } from '@workspace/ui/components/ui/label';
import { Input } from '@workspace/ui/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/ui/card';
import { OnboardingCanvas } from './onboarding-canvas';
import { ArrowLeft } from 'lucide-react';

const DEBOUNCE_MS = 500;

const TITLE_TRANSLATIONS: Record<string, string> = {
  en: 'What should we call you?',
  ko: '당신을 뭐라고 부르면 될까요?',
  ja: 'あなたを何と呼べばいいですか？',
  zh: '我们应该怎么称呼你？',
  es: '¿Cómo deberíamos llamarte?',
  fr: 'Comment devrions-nous vous appeler?',
  de: 'Wie sollen wir dich nennen?',
  pt: 'Como devemos te chamar?',
  ru: 'Как нам вас называть?',
  ar: 'ماذا يجب أن ندعوك؟',
};

const LABEL_TRANSLATIONS: Record<string, string> = {
  en: 'Your Name',
  ko: '이름',
  ja: '名前',
  zh: '你的名字',
  es: 'Tu nombre',
  fr: 'Votre nom',
  de: 'Dein Name',
  pt: 'Seu nome',
  ru: 'Ваше имя',
  ar: 'اسمك',
};

const GREETING_TRANSLATIONS: Record<string, (name: string) => string> = {
  en: (name) => `Nice to meet you, ${name}!`,
  ko: (name) => `반가워요, ${name}!`,
  ja: (name) => `はじめまして、${name}さん！`,
  zh: (name) => `很高兴见到你，${name}!`,
  es: (name) => `¡Encantado de conocerte, ${name}!`,
  fr: (name) => `Ravi de vous rencontrer, ${name}!`,
  de: (name) => `Schön dich kennenzulernen, ${name}!`,
  pt: (name) => `Prazer em conhecê-lo, ${name}!`,
  ru: (name) => `Приятно познакомиться, ${name}!`,
  ar: (name) => `!${name}، سررت بلقائك`,
};

type NameStepProps = {
  language: string;
  onComplete: (name: string) => void;
  onBack?: () => void;
};

export function NameStep({ language, onComplete, onBack }: NameStepProps) {
  const [name, setName] = useState('');
  const [debouncedName, setDebouncedName] = useState('');

  useEffect(() => {
    if (!name.trim()) {
      setDebouncedName('');
      return;
    }
    const id = setTimeout(() => setDebouncedName(name.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [name]);

  const handleContinue = () => {
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  const title = TITLE_TRANSLATIONS[language] || TITLE_TRANSLATIONS.en;
  const label = LABEL_TRANSLATIONS[language] || LABEL_TRANSLATIONS.en;
  const getGreeting = GREETING_TRANSLATIONS[language] ?? GREETING_TRANSLATIONS.en;
  const greeting = debouncedName && getGreeting ? getGreeting(debouncedName) : '';

  return (
    <>
      {/* Left Panel - Form */}
      <div className="flex flex-col gap-4 border-r border-border p-6 md:p-10 w-full lg:w-2/5">
        <div className="flex justify-center gap-2 md:justify-start">
          <span className="font-medium">ssota</span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">{label}</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && name.trim()) {
                        handleContinue();
                      }
                    }}
                    placeholder="Enter your name"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  {onBack && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onBack}
                      className="gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={handleContinue}
                    disabled={!name.trim()}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Right Panel - Canvas */}
      <div className="hidden lg:block lg:w-3/5 bg-muted relative min-h-0">
        <div className="absolute inset-0">
          <OnboardingCanvas
            step="name"
            language={language}
            greeting={greeting || '...'}
          />
        </div>
      </div>
    </>
  );
}
