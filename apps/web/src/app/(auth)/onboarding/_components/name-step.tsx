'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import { Label } from '@workspace/ui/components/ui/label';
import { Input } from '@workspace/ui/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/ui/card';
import { OnboardingCanvas } from './onboarding-canvas';

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
};

export function NameStep({ language, onComplete }: NameStepProps) {
  const [name, setName] = useState('');

  const handleContinue = () => {
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  const title = TITLE_TRANSLATIONS[language] || TITLE_TRANSLATIONS.en;
  const label = LABEL_TRANSLATIONS[language] || LABEL_TRANSLATIONS.en;
  const getGreeting = GREETING_TRANSLATIONS[language] ?? GREETING_TRANSLATIONS.en;
  const greeting = name.trim() && getGreeting ? getGreeting(name.trim()) : '';

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
                <Button
                  onClick={handleContinue}
                  disabled={!name.trim()}
                  className="w-full"
                >
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
            step="name"
            language={language}
            greeting={greeting || '...'}
          />
        </div>
      </div>
    </>
  );
}
