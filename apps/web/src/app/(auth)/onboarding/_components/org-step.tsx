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
  onBack?: () => void;
};

export function OrgStep({ language, name, onComplete, onBack }: OrgStepProps) {
  const initialOrg = `${name}'s Organization`;
  const [orgName, setOrgName] = useState(initialOrg);
  const [debouncedOrgName, setDebouncedOrgName] = useState(initialOrg);

  useEffect(() => {
    if (!orgName.trim()) {
      setDebouncedOrgName('');
      return;
    }
    const id = setTimeout(() => setDebouncedOrgName(orgName.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [orgName]);

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
      <div className="flex flex-col gap-4 p-6 md:p-10 w-full lg:w-2/5">
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
                    disabled={!orgName.trim()}
                    className="flex-1"
                  >
                    Complete Setup
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
            step="organization"
            language={language}
            organizationName={debouncedOrgName || ''}
          />
        </div>
      </div>
    </>
  );
}
