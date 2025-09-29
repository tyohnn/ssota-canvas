"use client";

import { useState } from 'react';
import { useUserManagement } from '../hooks/use-user-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface OrganizationFormProps {
  organization?: any; // 편집 모드인 경우
  onSuccess?: () => void;
}

export function OrganizationForm({ organization, onSuccess }: OrganizationFormProps) {
  const { createOrganization, isCreatingOrganization } = useUserManagement();
  const [name, setName] = useState(organization?.name || '');
  const [slug, setSlug] = useState(organization?.slug || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('조직명을 입력해주세요');
      return;
    }

    try {
      await createOrganization(name, slug);
      toast.success(`조직이 ${organization ? '수정' : '생성'}되었습니다`);

      // 폼 초기화 (생성 모드인 경우)
      if (!organization) {
        setName('');
        setSlug('');
      }

      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '조직 생성에 실패했습니다');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">조직명</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="조직명을 입력하세요"
          required
        />
      </div>

      <div>
        <Label htmlFor="slug">슬러그</Label>
        <Input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="조직 슬러그 (선택사항)"
        />
      </div>

      <Button
        type="submit"
        disabled={isCreatingOrganization}
        className="w-full"
      >
        {isCreatingOrganization ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {organization ? '수정' : '생성'} 중...
          </>
        ) : (
          organization ? '조직 수정' : '조직 생성'
        )}
      </Button>
    </form>
  );
}