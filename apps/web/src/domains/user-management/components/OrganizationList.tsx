"use client";

import { useUserManagement } from '../hooks/use-user-management';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export function OrganizationList() {
  const { organizations, isLoading, error } = useUserManagement();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        로딩 중...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">오류: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">조직 목록</h3>

      {organizations.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          조직이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {organizations.map((organization) => (
            <div key={organization.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">{organization.name}</div>
                  <div className="text-sm text-gray-500">{organization.slug}</div>
                </div>
                <Badge variant={organization.isDefault ? 'default' : 'secondary'}>
                  {organization.isDefault ? '기본' : '일반'}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  편집
                </Button>
                <Button variant="outline" size="sm">
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}