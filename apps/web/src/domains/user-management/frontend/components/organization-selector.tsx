'use client';

import React from 'react';
import { useOrganization } from '../contexts/organization-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface OrganizationSelectorProps {
  className?: string;
  showRefreshButton?: boolean;
  onValueChange?: (value: string) => void;
}

export function OrganizationSelector({ 
  className,
  showRefreshButton = true,
  onValueChange
}: OrganizationSelectorProps) {
  const { 
    organizations, 
    selectedOrganizationId, 
    selectOrganization, 
    isLoading,
    error,
    refreshOrganizations
  } = useOrganization();

  const selectedOrganization = organizations.find(org => org.id.value === selectedOrganizationId);

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{error}</span>
        {showRefreshButton && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshOrganizations}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <span className="text-sm">조직이 없습니다</span>
        {showRefreshButton && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshOrganizations}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select 
        value={selectedOrganizationId || ''} 
        onValueChange={(value) => {
          selectOrganization(value);
          onValueChange?.(value);
        }}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="조직을 선택하세요">
            {selectedOrganization && (
              <span>
                {selectedOrganization.name}
                {selectedOrganization.isDefault && ' (기본)'}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {organizations.map(org => (
            <SelectItem key={org.id.value} value={org.id.value}>
              <div className="flex items-center gap-2">
                <span>{org.name}</span>
                {org.isDefault && (
                  <span className="text-xs text-gray-500">(기본)</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showRefreshButton && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshOrganizations}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}
