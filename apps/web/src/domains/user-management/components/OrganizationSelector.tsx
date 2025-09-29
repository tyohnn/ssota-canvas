"use client";

import { useUserManagement } from '../hooks/use-user-management';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface OrganizationSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function OrganizationSelector({ value, onValueChange, placeholder }: OrganizationSelectorProps) {
  const { organizations, isLoading } = useUserManagement();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">로딩 중...</span>
      </div>
    );
  }

  return (
    <Select value={value || ''} onValueChange={onValueChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={placeholder || "조직 선택"} />
      </SelectTrigger>
      <SelectContent>
        {organizations.map(organization => (
          <SelectItem key={organization.id} value={organization.id}>
            {organization.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}