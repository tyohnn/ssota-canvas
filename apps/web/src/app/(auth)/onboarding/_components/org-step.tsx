'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/ui/button';
import { Label } from '@workspace/ui/components/ui/label';
import { Input } from '@workspace/ui/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/ui/card';
import { OnboardingCanvas } from './onboarding-canvas';

const TITLE_TRANSLATIONS: Record<string, string> = {
  en: 'Name Your Organization',
  ko: '조직 이름을 입력해주세요',
  ja: '組織名を入力してください',
  zh: '命名你的组织',
  es: 'Nombra tu organización',
  fr: 'Nommez votre organisation',
  de: 'Benenne deine Organisation',
  pt: 'Nomeie sua organização',
  ru: 'Назовите вашу организацию',
  ar: 'قم بتسمية منظمتك',
};

const LABEL_TRANSLATIONS: Record<string, string> = {
  en: 'Organization Name',
  ko: '조직 이름',
  ja: '組織名',
  zh: '组织名称',
  es: 'Nombre de la organización',
  fr: "Nom de l'organisation",
  de: 'Organisationsname',
  pt: 'Nome da organização',
  ru: 'Название организации',
  ar: 'اسم المنظمة',
};

type OrgStepProps = {
  language: string;
  name: string;
  onComplete: (organizationName: string) => void;
};

export function OrgStep({ language, name, onComplete }: OrgStepProps) {
  const [orgName, setOrgName] = useState(`${name}'s Organization`);

  const handleContinue = () => {
    if (orgName.trim()) {
      onComplete(orgName.trim());
    }
  };

  const title = TITLE_TRANSLATIONS[language] || TITLE_TRANSLATIONS.en;
  const label = LABEL_TRANSLATIONS[language] || LABEL_TRANSLATIONS.en;

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
                  <Label htmlFor="organization">{label}</Label>
                  <Input
                    id="organization"
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && orgName.trim()) {
                        handleContinue();
                      }
                    }}
                    placeholder="Enter organization name"
                    autoFocus
                  />
                </div>
                <Button
                  onClick={handleContinue}
                  disabled={!orgName.trim()}
                  className="w-full"
                >
                  Complete Setup
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
            step="organization"
            language={language}
            organizationName={orgName || '...'}
          />
        </div>
      </div>
    </>
  );
}
